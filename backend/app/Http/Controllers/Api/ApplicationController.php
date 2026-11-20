<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\JobApplication;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\QueryException;
use Illuminate\Validation\Rule;
use Throwable;

class ApplicationController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        $applications = $request->user()->applications()
            ->with(['offer.employer:id,name,company_name'])
            ->latest()
            ->get()
            ->map(fn (JobApplication $application) => $this->candidateData($application));

        return response()->json(['data' => $applications]);
    }

    public function apply(Request $request, Offer $offer): JsonResponse
    {
        abort_unless($offer->status === 'active', 404);
        $candidate = $request->user();
        abort_unless(
            $candidate->cv_path && Storage::disk('local')->exists($candidate->cv_path),
            422,
            'Déposez un CV PDF dans votre profil avant de postuler.'
        );

        if ($candidate->applications()->where('offer_id', $offer->id)->exists()) {
            return response()->json(['message' => 'Vous avez déjà postulé à cette offre.'], 409);
        }

        $cvPath = null;
        try {
            $application = DB::transaction(function () use ($candidate, $offer, &$cvPath): JobApplication {
                $application = $candidate->applications()->create([
                    'offer_id' => $offer->id,
                    'status' => 'recue',
                    'cv_name' => $candidate->cv_name,
                ]);
                $cvPath = 'private/applications/'.$application->id.'/'.basename($candidate->cv_path);
                abort_unless(
                    Storage::disk('local')->copy($candidate->cv_path, $cvPath),
                    500,
                    'Le CV n’a pas pu être joint à la candidature.'
                );
                $application->update(['cv_path' => $cvPath]);
                $application->load(['offer.employer:id,name,company_name']);

                AppNotification::create([
                    'user_id' => $candidate->id,
                    'title' => 'Candidature envoyée',
                    'message' => 'Votre candidature pour « '.$offer->title.' » a bien été transmise à '.($offer->employer->company_name ?: $offer->employer->name).'.',
                ]);
                AppNotification::create([
                    'user_id' => $offer->employer_id,
                    'title' => 'Nouvelle candidature reçue',
                    'message' => $candidate->name.' a postulé à votre offre « '.$offer->title.' ».',
                ]);

                return $application;
            });
        } catch (Throwable $error) {
            if ($cvPath) Storage::disk('local')->delete($cvPath);

            if ($error instanceof QueryException) {
                $message = $error->getMessage();
                $duplicate = str_contains($message, 'job_applications_offer_id_candidate_id_unique')
                    || str_contains($message, 'UNIQUE constraint failed: job_applications.offer_id, job_applications.candidate_id');

                if ($duplicate) {
                    return response()->json(['message' => 'Vous avez déjà postulé à cette offre.'], 409);
                }
            }

            throw $error;
        }

        return response()->json(['data' => $this->candidateData($application)], 201);
    }

    public function forEmployer(Request $request): JsonResponse
    {
        $applications = JobApplication::query()
            ->with(['offer', 'candidate:id,name,email,cv_name,cv_path,bio,location,skills'])
            ->whereHas('offer', fn ($query) => $query->where('employer_id', $request->user()->id))
            ->latest()
            ->get()
            ->map(fn (JobApplication $application) => $this->employerData($application));

        return response()->json(['data' => $applications]);
    }

    public function updateStatus(Request $request, JobApplication $application): JsonResponse
    {
        abort_unless($application->offer()->where('employer_id', $request->user()->id)->exists(), 404);
        $validated = $request->validate([
            'statut' => ['required', Rule::in(['recue', 'examen', 'acceptee', 'refusee'])],
        ]);

        DB::transaction(function () use ($application, $validated): void {
            $application->update(['status' => $validated['statut']]);
            $application->load('offer');

            if ($application->wasChanged('status') && $validated['statut'] !== 'recue') {
                AppNotification::create([
                    'user_id' => $application->candidate_id,
                    'title' => 'Statut de candidature mis à jour',
                    'message' => 'Votre candidature pour « '.$application->offer->title.' » est maintenant : '.$validated['statut'].'.',
                ]);
            }
        });

        return response()->json(['data' => $this->employerData($application->load('candidate:id,name,email,cv_name,cv_path,bio,location,skills'))]);
    }

    public function downloadCandidateCv(Request $request, JobApplication $application)
    {
        abort_unless($application->offer()->where('employer_id', $request->user()->id)->exists(), 404);
        $candidate = $application->candidate;
        $cvPath = $application->cv_path ?: $candidate->cv_path;
        abort_unless($cvPath && Storage::disk('local')->exists($cvPath), 404, 'Aucun CV joint à cette candidature.');

        return Storage::disk('local')->download($cvPath, $application->cv_name ?: $candidate->cv_name ?: 'cv.pdf');
    }

    public function notifications(Request $request): JsonResponse
    {
        $notifications = $request->user()->appNotifications()->latest()->get()->map(fn (AppNotification $notification) => [
            'id' => $notification->id,
            'titre' => $notification->title,
            'message' => $notification->message,
            'date' => $notification->created_at->locale('fr')->diffForHumans(),
            'unread' => $notification->read_at === null,
        ]);

        return response()->json(['data' => $notifications]);
    }

    public function markNotificationRead(Request $request, AppNotification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 404);
        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marquée comme lue.']);
    }

    private function candidateData(JobApplication $application): array
    {
        $offer = $application->offer;
        $data = OfferController::offerData($offer);

        return [
            'id' => $application->id,
            'offerId' => $offer->id,
            'titre' => $data['titre'],
            'entreprise' => $data['entreprise'],
            'initiales' => $data['initiales'],
            'couleur' => $data['couleur'],
            'date' => $application->created_at->locale('fr')->diffForHumans(),
            'statut' => $application->status,
            'cv' => $application->cv_name,
        ];
    }

    private function employerData(JobApplication $application): array
    {
        return [
            'id' => $application->id,
            'offerId' => $application->offer_id,
            'offre' => $application->offer->title,
            'candidat' => $application->candidate->name,
            'email' => $application->candidate->email,
            'profil' => [
                'bio' => $application->candidate->bio,
                'localisation' => $application->candidate->location,
                'competences' => $application->candidate->skills ?? [],
            ],
            'date' => $application->created_at->locale('fr')->diffForHumans(),
            'statut' => $application->status,
            'cv' => $application->cv_name ?: $application->candidate->cv_name ?: 'Aucun CV',
            'cvDisponible' => $application->cv_path !== null || $application->candidate->cv_path !== null,
        ];
    }
}
