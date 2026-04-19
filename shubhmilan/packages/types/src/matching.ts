export interface MatchReason {
  icon: string;
  text: string;
  weight: number;
}

export interface MatchResult {
  profileId: string;
  score: number;
  reasons: MatchReason[];
  computedAt: string;
}

export interface GunaMilanResult {
  totalPoints: number;
  outOf: 36;
  compatibility: 'Not Recommended' | 'Average' | 'Good' | 'Excellent';
  breakdown: {
    varna: { points: number; max: 1 };
    vashya: { points: number; max: 2 };
    tara: { points: number; max: 3 };
    yoni: { points: number; max: 4 };
    grahaMaitri: { points: number; max: 5 };
    gana: { points: number; max: 6 };
    bhakoot: { points: number; max: 7 };
    nadi: { points: number; max: 8 };
  };
  doshas: { manglik: boolean; nadiDosha: boolean; bhakootDosha: boolean };
}
