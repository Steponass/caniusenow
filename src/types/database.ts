export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_feature_tracking: {
        Row: {
          id: string;
          user_id: string;
          feature_id: string;
          feature_title: string;
          triggers: Json;
          status: "active" | "notified" | "completed";
          notified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          feature_id: string;
          feature_title: string;
          triggers: Json;
          status?: "active" | "notified" | "completed";
          notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          feature_id?: string;
          feature_title?: string;
          triggers?: Json;
          status?: "active" | "notified" | "completed";
          notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
