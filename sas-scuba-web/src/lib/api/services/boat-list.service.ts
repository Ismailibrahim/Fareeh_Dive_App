import apiClient from "../client";

export interface Boat {
    id: number;
    name: string;
}

export interface DiveSite {
    id: number;
    name: string;
}

export interface Customer {
    id: number;
    full_name: string;
    email?: string;
    phone?: string;
    nationality?: string;
    gender?: string;
    departure_date?: string;
    departure_flight?: string;
    departure_flight_time?: string;
    departure_to?: string;
}

export interface EquipmentItem {
    id: number;
    inventory_code?: string;
    size?: string;
    serial_no?: string;
    brand?: string;
    equipment?: {
        id: number;
        name: string;
    };
}

export interface CustomerEquipment {
    type?: string;
    brand?: string;
    model?: string;
    serial?: string;
    notes?: string;
}

export interface BookingEquipment {
    id: number;
    equipment_source: 'Center' | 'Customer Own';
    price?: number;
    checkout_date?: string;
    return_date?: string;
    assignment_status?: string;
    equipment_item?: EquipmentItem;
    customer_equipment?: CustomerEquipment;
}

export interface EquipmentBasket {
    id: number;
    basket_no: string;
    center_bucket_no?: string;
    checkout_date?: string;
    expected_return_date?: string;
    status?: string;
    equipment: BookingEquipment[];
}

export interface Certification {
    id: number;
    certification_name: string;
    certification_no?: string;
    certification_date?: string;
    agency?: string;
    instructor?: string;
    no_of_dives?: number;
    last_dive_date?: string;
}

export interface CustomerWithEquipment {
    customer: Customer;
    certification: Certification | null;
    equipment_basket: EquipmentBasket | null;
}

export interface DiveGuide {
    id: number;
    user_id: number;
    full_name: string;
    role?: string;
}

export interface BoatListSession {
    session_key: string;
    boat: Boat | null;
    dive_date: string | null;
    dive_time: string | null;
    dive_site: DiveSite | null;
    customers: CustomerWithEquipment[];
    dive_guides: DiveGuide[];
}

export interface BoatListFilters {
    date_from?: string;
    date_to?: string;
    boat_id?: number;
    dive_site_id?: number;
}

export const boatListService = {
    getBoatList: async (filters?: BoatListFilters): Promise<BoatListSession[]> => {
        const params = new URLSearchParams();
        
        if (filters?.date_from) {
            params.append('date_from', filters.date_from);
        }
        if (filters?.date_to) {
            params.append('date_to', filters.date_to);
        }
        if (filters?.boat_id) {
            params.append('boat_id', filters.boat_id.toString());
        }
        if (filters?.dive_site_id) {
            params.append('dive_site_id', filters.dive_site_id.toString());
        }

        const queryString = params.toString();
        const url = `/api/v1/boat-list${queryString ? `?${queryString}` : ''}`;
        
        const response = await apiClient.get<BoatListSession[]>(url);
        return response.data;
    }
};

