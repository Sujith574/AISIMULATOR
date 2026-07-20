const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson.error || errorJson.message || errorText;
      } catch {}
      throw new Error(parsedError || `Request failed with status ${response.status}`);
    }

    // Handle empty response
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  // Email + Password Auth APIs
  async signIn(email: string, password: string): Promise<{ token: string; email: string; userId: string }> {
    const res = await this.request<{ token: string; email: string; userId: string }>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem("authToken", res.token);
      localStorage.setItem("authEmail", res.email);
    }
    return res;
  }

  async signUp(email: string, password: string): Promise<{ token: string; email: string; userId: string }> {
    const res = await this.request<{ token: string; email: string; userId: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem("authToken", res.token);
      localStorage.setItem("authEmail", res.email);
    }
    return res;
  }


  signOut(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
  }

  async getMe(): Promise<{ userId: string; email: string }> {
    return this.request<{ userId: string; email: string }>("/auth/me");
  }

  isAuthenticated(): boolean {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("authToken");
    }
    return false;
  }

  // Profile APIs
  async getProfile(): Promise<any> {
    return this.request<any>("/profile");
  }

  async saveProfile(profileData: any): Promise<any> {
    return this.request<any>("/profile", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  }

  // Assessment APIs
  async getAssessment(): Promise<any> {
    return this.request<any>("/assessment");
  }

  async saveAssessment(assessmentData: any): Promise<any> {
    return this.request<any>("/assessment", {
      method: "POST",
      body: JSON.stringify(assessmentData),
    });
  }

  // Habits APIs
  async getHabits(): Promise<any[]> {
    return this.request<any[]>("/habits");
  }

  async createHabit(habitData: { name: string; type: "positive" | "negative"; frequency: string; duration: number; consistencyScore: number }): Promise<any> {
    return this.request<any>("/habits", {
      method: "POST",
      body: JSON.stringify(habitData),
    });
  }

  async updateHabit(id: string, habitData: Partial<{ name: string; type: "positive" | "negative"; frequency: string; duration: number; consistencyScore: number }>): Promise<any> {
    return this.request<any>(`/habits/${id}`, {
      method: "PUT",
      body: JSON.stringify(habitData),
    });
  }

  async deleteHabit(id: string): Promise<any> {
    return this.request<any>(`/habits/${id}`, {
      method: "DELETE",
    });
  }

  // Simulation APIs
  async runSimulation(): Promise<any> {
    return this.request<any>("/simulations/run", {
      method: "POST",
    });
  }

  async getLatestSimulation(): Promise<any> {
    return this.request<any>("/simulations/latest");
  }

  async getSimulationHistory(): Promise<any[]> {
    return this.request<any[]>("/simulations/history");
  }

  // What-If APIs
  async runWhatIf(query: string): Promise<any> {
    return this.request<any>("/simulations/whatif", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async getWhatIfHistory(): Promise<any[]> {
    return this.request<any[]>("/simulations/whatif/history");
  }
}

export const api = new ApiClient();
export default api;
