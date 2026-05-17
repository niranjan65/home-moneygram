import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { getCustomerById } from '../api/customer';
import { useUser } from '../../../context/UserContext';

export const useCustomer = () => {
  const loginUser = useUser();
  const { setValue, getValues } = useFormContext();
  const [loading, setLoading] = useState(false);

  const initialDocFile = getValues ? getValues('docFile') : null;
  const [previewUrl, setPreviewUrl] = useState(() => {
    if (!initialDocFile) return null;
    if (typeof initialDocFile === 'string') return initialDocFile;
    if (initialDocFile instanceof File || initialDocFile instanceof Blob) {
      return URL.createObjectURL(initialDocFile);
    }
    return null;
  });
  const [previewFile, setPreviewFile] = useState(() => {
    if (!initialDocFile) return null;
    if (initialDocFile instanceof File || initialDocFile instanceof Blob) return initialDocFile;
    return null;
  });

  const clearCustomerData = useCallback(() => {
    setValue('firstName', '');
    setValue('lastName', '');
    setValue('country', '');
    setValue('city', '');
    setValue('idNumber', '');
    setValue('docFile', null);
    setPreviewUrl(null);
    setPreviewFile(null);
  }, [setValue]);

  const fetchAndFillCustomer = useCallback(async (idNumber) => {
    if (!idNumber || idNumber.length < 3) return;
    
    setLoading(true);
    const customer = await getCustomerById(idNumber, loginUser);
    setLoading(false);

    if (customer) {
      setValue('firstName', customer.custom_first_name || '');
      setValue('lastName', customer.custom_last_name || '');
      setValue('middleName', customer.custom_middle_name || '');
      setValue('secondLastName', customer.custom_second_last_name_family_name || '');
      setValue('country', customer.custom_country || '');
      setValue('city', customer.custom_city || '');
      setValue('government_id', customer.custom_government_id || '');
      setValue('dateOfBirth', customer.custom_date_of_birth || '');
      setValue('idIssueCountry', customer.custom_id_issue_country || '');
      setValue('idIssueState', customer.custom_id_issue_stateprovince || '');
      setValue('idName', customer.custom_full_name || '');
      setValue('idNumber', customer.custom_drivers_licence_number || customer.custom_tin_number || customer.custom_voter_id_number || customer.custom_passport_number);
      setValue('idType', customer.custom_government_id || '');
      setValue('occupation', customer.custom_occupation || '');
      console.log('Customer found...', customer);

      if (customer.image) {
        const url = customer.image.startsWith('http') 
          ? customer.image 
          : `/${customer.image}`;
          
        setPreviewUrl(url);
        setPreviewFile(null);
        setValue('docFile', url, { shouldValidate: true });
      }
    }
  }, [setValue, loginUser]);

  const removeFile = useCallback(() => {
    setValue('docFile', null, { shouldValidate: true });
    setPreviewFile(null);
    setPreviewUrl(null);
  }, [setValue]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      alert('Please upload a JPG, PNG, WEBP, or PDF file.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be under 10 MB.');
      return;
    }
    
    setValue('docFile', file, { shouldValidate: true });
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [setValue]);

  return {
    loading,
    previewUrl,
    previewFile,
    fetchAndFillCustomer,
    clearCustomerData,
    removeFile,
    handleFile,
  };
};
