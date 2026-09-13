export interface FragranceNotes {
    top?: string[];
    heart?: string[];
    base?: string[];
    top_notes?: string[];
    heart_notes?: string[];
    base_notes?: string[];
}

export interface Perfume {
    id?: string;
    name: string;
    brand: string;
    notes?: FragranceNotes;
    main_accords?: string[];
    seasonality?: string[];
    created_at?: string;
}

export interface CreatePerfumeDto {
    name: string,
    brand: string
}

