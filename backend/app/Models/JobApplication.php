<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    protected $fillable = ['offer_id', 'candidate_id', 'status', 'cv_path', 'cv_name'];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }
}
