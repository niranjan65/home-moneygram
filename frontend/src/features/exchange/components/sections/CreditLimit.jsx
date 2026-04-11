import React, { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form';
import { getCustomerById } from '../../api/customer';
import { useUser } from '../../../../context/UserContext';

const CreditLimit = ({ sendAmount, onLimitCheck }) => {
    const { register, watch, formState: { errors } } = useFormContext();
    const loginUser = useUser();

    const [availableCurrency, setAvailableCurrency] = useState(2000);
    const [showUploadModal, setShowUploadModal] = useState(true)

    useEffect(() => {
        const isExceeded = sendAmount > 0 && sendAmount > availableCurrency;
        onLimitCheck?.(isExceeded);
    }, [sendAmount, availableCurrency]);

    const idName = watch('idName');
    const dateOfBirth = watch('dateOfBirth');

    const getCustomerDetails = async (idNumber) => {
        const customer = await getCustomerById(idNumber, loginUser);
        if (customer && customer.custom_available_currency_transfer_balance !== undefined && customer.custom_available_currency_transfer_balance !== null) {
            setAvailableCurrency(customer.custom_available_currency_transfer_balance);
        } else {
            setAvailableCurrency(2000);
        }
    }

    const formatDate = (date) => {
        if (!date) return null;
        const dObj = new Date(date);
        if (isNaN(dObj.getTime())) return null;
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const d = String(dObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    useEffect(() => {
        if (idName && dateOfBirth) {
            const formattedDate = formatDate(dateOfBirth);
            if (formattedDate) {
                getCustomerDetails(`${idName}_${formattedDate}`);
            }
        } else {
            setAvailableCurrency(2000);
        }
    }, [idName, dateOfBirth])


    if (availableCurrency === null || availableCurrency === undefined) {
        return null;
    }

    return (
        <div>
            {/* {showUploadModal && ( ... ) */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center justify-between" data-purpose="credit-limit-section">
                <div className="flex items-center space-x-4">
                    <div className="bg-red-600 p-3 rounded-full">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Available Transfer Currency Credit Limit</h3>
                        <p className="text-sm text-red-700">Your current limit for this transaction period</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-red-400 tracking-widest">RBF Transaction Limit</span>
                    <span className="text-2xl font-black text-red-900">FJ$ {Number(availableCurrency).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                </div>
            </div>
        </div>
    )
}

export default CreditLimit
