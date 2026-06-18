"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { getProvinces, getDistricts, getWards } from "@/lib/api/location";
import { useAddAddress, useUpdateAddress, type Address } from "@/features/profile/useAddresses";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface AddressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    address?: Address; // If provided, we are in Edit mode
    onSuccess?: () => void;
}

export function AddressDialog({ open, onOpenChange, address, onSuccess }: AddressDialogProps) {
    const isEdit = !!address;
    const { t } = useI18n();

    const [label, setLabel] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [phone, setPhone] = useState("");
    const [street, setStreet] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    const [selectedProvinceId, setSelectedProvinceId] = useState<number | string>("");
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | string>("");
    const [selectedWardCode, setSelectedWardCode] = useState<string>("");

    const addAddressMutation = useAddAddress();
    const updateAddressMutation = useUpdateAddress();

    // Initial load provinces
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const data = await getProvinces();
                setProvinces(data || []);
            } catch (error) {
                console.error("Failed to fetch provinces", error);
            }
        };
        fetchProvinces();
    }, []);

    // Load initial data if editing
    useEffect(() => {
        if (address && open) {
            setLabel(address.label || "");
            setReceiverName(address.receiver_name || "");
            setPhone(address.phone || "");
            setStreet(address.street || "");
            setIsDefault(address.is_default || false);
            setSelectedProvinceId(address.ghn_province_id || "");
            setSelectedDistrictId(address.ghn_district_id || "");
            setSelectedWardCode(address.ghn_ward_code || "");
        } else if (open) {
            // Reset form for new address
            setLabel("");
            setReceiverName("");
            setPhone("");
            setStreet("");
            setIsDefault(false);
            setSelectedProvinceId("");
            setSelectedDistrictId("");
            setSelectedWardCode("");
        }
    }, [address, open]);

    // Fetch districts when province changes
    useEffect(() => {
        if (selectedProvinceId) {
            const fetchDistricts = async () => {
                try {
                    const data = await getDistricts(selectedProvinceId);
                    setDistricts(data || []);
                } catch (error) {
                    console.error("Failed to fetch districts", error);
                }
            };
            fetchDistricts();
        } else {
            setDistricts([]);
            setWards([]);
        }
    }, [selectedProvinceId]);

    // Fetch wards when district changes
    useEffect(() => {
        if (selectedDistrictId) {
            const fetchWards = async () => {
                try {
                    const data = await getWards(selectedDistrictId);
                    setWards(data || []);
                } catch (error) {
                    console.error("Failed to fetch wards", error);
                }
            };
            fetchWards();
        } else {
            setWards([]);
        }
    }, [selectedDistrictId]);

    const provinceOptions = Array.isArray(provinces) ? provinces.map(p => ({ value: p.ProvinceID, label: p.ProvinceName })) : [];
    const districtOptions = Array.isArray(districts) ? districts.map(d => ({ value: d.DistrictID, label: d.DistrictName })) : [];
    const wardOptions = Array.isArray(wards) ? wards.map(w => ({ value: w.WardCode, label: w.WardName })) : [];

    const handleSave = async () => {
        if (!receiverName || !phone || !selectedProvinceId || !selectedDistrictId || !selectedWardCode || !street) {
            toast.error(t('address.requiredFields'));
            return;
        }

        const provinceName = provinces.find(p => p.ProvinceID === Number(selectedProvinceId))?.ProvinceName;
        const districtName = districts.find(d => d.DistrictID === Number(selectedDistrictId))?.DistrictName;
        const wardName = wards.find(w => w.WardCode === String(selectedWardCode))?.WardName;

        const payload = {
            label,
            receiver_name: receiverName,
            phone,
            province: provinceName,
            district: districtName,
            ward: wardName,
            street,
            is_default: isDefault,
            ghn_province_id: Number(selectedProvinceId),
            ghn_district_id: Number(selectedDistrictId),
            ghn_ward_code: String(selectedWardCode),
        };

        try {
            if (isEdit && address) {
                await updateAddressMutation.mutateAsync({
                    id: address.id,
                    data: payload
                });
            } else {
                await addAddressMutation.mutateAsync(payload);
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            // Error managed by mutation
        }
    };

    const isPending = addAddressMutation.isPending || updateAddressMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        {isEdit ? t('address.editTitle') : t('address.addTitle')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="label">{t('address.label')}</Label>
                        <Input
                            id="label"
                            placeholder={t('address.labelPlaceholder')}
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="receiverName">{t('address.receiverName')}</Label>
                            <Input
                                id="receiverName"
                                placeholder={t('address.receiverPlaceholder')}
                                value={receiverName}
                                onChange={(e) => setReceiverName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('address.phone')}</Label>
                            <Input
                                id="phone"
                                placeholder={t('address.phonePlaceholder')}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('address.province')}</Label>
                        <Combobox
                            placeholder={t('address.provinceSelect')}
                            options={provinceOptions}
                            value={selectedProvinceId}
                            onChange={(val) => {
                                setSelectedProvinceId(val);
                                setSelectedDistrictId("");
                                setSelectedWardCode("");
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('address.district')}</Label>
                            <Combobox
                                placeholder={t('address.districtSelect')}
                                options={districtOptions}
                                value={selectedDistrictId}
                                onChange={(val) => {
                                    setSelectedDistrictId(val);
                                    setSelectedWardCode("");
                                }}
                                disabled={!selectedProvinceId}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('address.ward')}</Label>
                            <Combobox
                                placeholder={t('address.wardSelect')}
                                options={wardOptions}
                                value={selectedWardCode}
                                onChange={(val) => setSelectedWardCode(val as string)}
                                disabled={!selectedDistrictId}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="street">{t('address.street')}</Label>
                        <Input
                            id="street"
                            placeholder={t('address.streetPlaceholder')}
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="is-default"
                            checked={isDefault}
                            onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                        />
                        <label
                            htmlFor="is-default"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
                        >
                            {t('address.setDefault')}
                        </label>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                        onClick={handleSave}
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? t('address.update') : t('address.addNew')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
