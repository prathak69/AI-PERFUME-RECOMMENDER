export interface RecommendRequestDto {
    city: string,
    occasion: string
}

export interface RecommendResult {
    recommended_perfume: string,
    reasoning: string
}

export interface WeatherContext {
    temp: string;
    condition: string;
    description: string;
    humidity: string;
    w_code?: number | string;
}

export interface RecommendResponse {
    status: string;
    weather: WeatherContext;
    time_of_day: string;
    recommendation: RecommendResult;
}