import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nationalityService, Nationality, NationalityFormData } from "@/lib/api/services/nationality.service";
import { unitService, Unit, UnitFormData } from "@/lib/api/services/unit.service";
import { countryService, Country, CountryFormData } from "@/lib/api/services/country.service";
import { islandService, Island, IslandFormData } from "@/lib/api/services/island.service";
import { relationshipService, Relationship, RelationshipFormData } from "@/lib/api/services/relationship.service";
import { agencyService, Agency, AgencyFormData } from "@/lib/api/services/agency.service";
import { serviceTypeService, ServiceType, ServiceTypeFormData } from "@/lib/api/services/service-type.service";
import { locationService, Location, LocationFormData } from "@/lib/api/services/location.service";
import { categoryService, Category, CategoryFormData } from "@/lib/api/services/category.service";
import { serviceProviderService, ServiceProvider, ServiceProviderFormData } from "@/lib/api/services/service-provider.service";
import { supplierService, Supplier, SupplierFormData } from "@/lib/api/services/supplier.service";

// Query keys for settings dropdowns
export const settingsDropdownKeys = {
    all: ['settings-dropdowns'] as const,
    nationalities: () => [...settingsDropdownKeys.all, 'nationalities'] as const,
    units: () => [...settingsDropdownKeys.all, 'units'] as const,
    countries: () => [...settingsDropdownKeys.all, 'countries'] as const,
    islands: () => [...settingsDropdownKeys.all, 'islands'] as const,
    relationships: () => [...settingsDropdownKeys.all, 'relationships'] as const,
    agencies: () => [...settingsDropdownKeys.all, 'agencies'] as const,
    serviceTypes: () => [...settingsDropdownKeys.all, 'service-types'] as const,
    locations: () => [...settingsDropdownKeys.all, 'locations'] as const,
    categories: () => [...settingsDropdownKeys.all, 'categories'] as const,
    serviceProviders: () => [...settingsDropdownKeys.all, 'service-providers'] as const,
    suppliers: () => [...settingsDropdownKeys.all, 'suppliers'] as const,
};

// Nationalities
export function useNationalities() {
    return useQuery({
        queryKey: settingsDropdownKeys.nationalities(),
        queryFn: () => nationalityService.getAll(),
        staleTime: 15 * 60 * 1000, // 15 minutes - dropdown data changes rarely
        gcTime: 60 * 60 * 1000, // 1 hour
    });
}

export function useCreateNationality() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: NationalityFormData) => nationalityService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.nationalities() });
        },
    });
}

export function useUpdateNationality() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: NationalityFormData }) =>
            nationalityService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.nationalities() });
        },
    });
}

export function useDeleteNationality() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => nationalityService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.nationalities() });
        },
    });
}

// Units
export function useUnits() {
    return useQuery({
        queryKey: settingsDropdownKeys.units(),
        queryFn: () => unitService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UnitFormData) => unitService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.units() });
        },
    });
}

export function useUpdateUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UnitFormData }) =>
            unitService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.units() });
        },
    });
}

export function useDeleteUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => unitService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.units() });
        },
    });
}

// Countries
export function useCountries() {
    return useQuery({
        queryKey: settingsDropdownKeys.countries(),
        queryFn: () => countryService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateCountry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CountryFormData) => countryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.countries() });
        },
    });
}

export function useUpdateCountry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CountryFormData }) =>
            countryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.countries() });
        },
    });
}

export function useDeleteCountry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => countryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.countries() });
        },
    });
}

// Islands
export function useIslands() {
    return useQuery({
        queryKey: settingsDropdownKeys.islands(),
        queryFn: () => islandService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateIsland() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: IslandFormData) => islandService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.islands() });
        },
    });
}

export function useUpdateIsland() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IslandFormData }) =>
            islandService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.islands() });
        },
    });
}

export function useDeleteIsland() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => islandService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.islands() });
        },
    });
}

// Relationships
export function useRelationships() {
    return useQuery({
        queryKey: settingsDropdownKeys.relationships(),
        queryFn: () => relationshipService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateRelationship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RelationshipFormData) => relationshipService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.relationships() });
        },
    });
}

export function useUpdateRelationship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: RelationshipFormData }) =>
            relationshipService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.relationships() });
        },
    });
}

export function useDeleteRelationship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => relationshipService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.relationships() });
        },
    });
}

// Agencies
export function useAgencies() {
    return useQuery({
        queryKey: settingsDropdownKeys.agencies(),
        queryFn: () => agencyService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateAgency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AgencyFormData) => agencyService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.agencies() });
        },
    });
}

export function useUpdateAgency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: AgencyFormData }) =>
            agencyService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.agencies() });
        },
    });
}

export function useDeleteAgency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => agencyService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.agencies() });
        },
    });
}

// Service Types
export function useServiceTypes() {
    return useQuery({
        queryKey: settingsDropdownKeys.serviceTypes(),
        queryFn: () => serviceTypeService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateServiceType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ServiceTypeFormData) => serviceTypeService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.serviceTypes() });
        },
    });
}

export function useUpdateServiceType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ServiceTypeFormData }) =>
            serviceTypeService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.serviceTypes() });
        },
    });
}

export function useDeleteServiceType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => serviceTypeService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.serviceTypes() });
        },
    });
}

// Locations
export function useLocations() {
    return useQuery({
        queryKey: settingsDropdownKeys.locations(),
        queryFn: () => locationService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: LocationFormData) => locationService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.locations() });
        },
    });
}

export function useUpdateLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: LocationFormData }) =>
            locationService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.locations() });
        },
    });
}

export function useDeleteLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => locationService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.locations() });
        },
    });
}

// Categories
export function useCategories() {
    return useQuery({
        queryKey: settingsDropdownKeys.categories(),
        queryFn: () => categoryService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CategoryFormData) => categoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.categories() });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CategoryFormData }) =>
            categoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.categories() });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => categoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.categories() });
        },
    });
}

// Service Providers
export function useServiceProviders() {
    return useQuery({
        queryKey: settingsDropdownKeys.serviceProviders(),
        queryFn: () => serviceProviderService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateServiceProvider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ServiceProviderFormData) => serviceProviderService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.serviceProviders() });
        },
    });
}

export function useUpdateServiceProvider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ServiceProviderFormData }) =>
            serviceProviderService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.serviceProviders() });
        },
    });
}

export function useDeleteServiceProvider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => serviceProviderService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.serviceProviders() });
        },
    });
}

// Suppliers
export function useSuppliers() {
    return useQuery({
        queryKey: settingsDropdownKeys.suppliers(),
        queryFn: () => supplierService.getAll(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SupplierFormData) => supplierService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.suppliers() });
        },
    });
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SupplierFormData }) =>
            supplierService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.suppliers() });
        },
    });
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => supplierService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: settingsDropdownKeys.suppliers() });
        },
    });
}
