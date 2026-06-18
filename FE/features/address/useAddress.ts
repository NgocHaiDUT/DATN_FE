import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAddresses, addAddress, updateAddress, deleteAddress, Address } from "@/lib/api/address";

export function useAddresses() {
    return useQuery({
        queryKey: ["addresses"],
        queryFn: getMyAddresses,
    });
}

export function useAddAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses"] });
        },
    });
}

export function useUpdateAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Address> }) => updateAddress(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses"] });
        },
    });
}

export function useDeleteAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addresses"] });
        },
    });
}
