import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ApiResponse } from "../models/api-response.model";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment.development";
import { CreatePerfumeDto, Perfume } from "../models/perfume.model";
import { RecommendRequestDto, RecommendResponse } from "../models/recommend.model";


@Injectable({
    providedIn: 'root'
})
export class PerfumeService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;

    getInventory(): Observable<ApiResponse<Perfume[]>> {
        return this.http.get<ApiResponse<Perfume[]>>(`${this.baseUrl}/perfume`);
    }

    addPerfume(request: CreatePerfumeDto): Observable<ApiResponse<Perfume>> {
        return this.http.post<ApiResponse<Perfume>>(`${this.baseUrl}/perfume`, request);
    }

    recommendPerfume(request: RecommendRequestDto): Observable<RecommendResponse> {
        return this.http.post<RecommendResponse>(`${this.baseUrl}/recommend`, request);
    }

    getPerfumeById(perfumeId: string): Observable<ApiResponse<Perfume>> {
        return this.http.get<ApiResponse<Perfume>>(`${this.baseUrl}/perfume/${perfumeId}`);
    }

    deletePerfumeById(perfumeId: string | undefined): Observable<ApiResponse<string>> {
        return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/perfume/${perfumeId}`)
    }

}

