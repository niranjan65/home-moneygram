import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { getCustomerById } from '../api/customer';
import { useUser } from '../../../context/UserContext';

export const useCustomer = ({ autoFillDocument = true } = {}) => {
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
    setValue('customer_id', '');
    setValue('idName', '');
    setValue('firstName', '');
    setValue('middleName', '');
    setValue('lastName', '');
    setValue('secondLastName', '');
    setValue('dateOfBirth', '');
    setValue('government_id', 'Passport');
    setValue('idType', 'Passport');
    setValue('idNumber', '');
    setValue('idIssueCountry', '');
    setValue('idIssueState', '');
    setValue('occupation', '');
    setValue('country', '');
    setValue('city', '');
    setValue('phone_number', '');
    setValue('phoneNumber', '');
    setValue('docFile', null);
    setValue('tinNumber', '');
    setValue('risk_level', 'Low');
    setValue('remarks', '');
    setPreviewUrl(null);
    setPreviewFile(null);
  }, [setValue]);

  const fetchAndFillCustomer = useCallback(async (idNumber) => {
    if (!idNumber || idNumber.length < 2) return null;
    
    setLoading(true);
    const customer = await getCustomerById(idNumber, loginUser);
    setLoading(false);

    if (customer) {
      console.log('👤 [useCustomer] Fetched customer details:', {
        id: customer.custom_customer_id || customer.name,
        name: customer.custom_full_name || customer.customer_name,
        mobile_no: customer.mobile_no,
        phone_number: customer.phone_number,
      });
      setValue('customer_id', customer.custom_customer_id || customer.name || idNumber);
      setValue('firstName', customer.custom_first_name || '');
      setValue('lastName', customer.custom_last_name || '');
      setValue('middleName', customer.custom_middle_name || '');
      setValue('secondLastName', customer.custom_second_last_name_family_name || '');
      setValue('country', customer.custom_country || '');
      setValue('city', customer.custom_city || '');
      const fetchedPhone = customer.mobile_no || customer.phone_number || customer.phone || '';
      setValue('phone_number', fetchedPhone);
      setValue('phoneNumber', fetchedPhone);
      setValue('email', customer.email_id || customer.receiver_mailid || '');
      setValue('government_id', customer.custom_government_id || 'Passport');
      setValue('dateOfBirth', customer.custom_date_of_birth || '');
      setValue('idIssueCountry', customer.custom_id_issue_country || '');
      setValue('idIssueState', customer.custom_id_issue_stateprovince || '');
      setValue('idName', customer.custom_full_name || '');
      setValue('idNumber', customer.custom_drivers_licence_number || customer.custom_tin_number || customer.custom_voter_id_number || customer.custom_passport_number || '');
      setValue('idType', customer.custom_government_id || 'Passport');
      setValue('occupation', customer.custom_occupation || '');
      setValue('tinNumber', customer.custom_tin_number || '');
      const fetchedRisk = customer.custom_risk_level || customer.risk_level || 'Low';
      setValue('risk_level', fetchedRisk, { shouldValidate: true, shouldDirty: true });
      console.log('Customer found...', customer);

      if (autoFillDocument && customer.image) {
        const url = customer.image.startsWith('http') 
          ? customer.image 
          : `/${customer.image}`;
          
        setPreviewUrl(url);
        setPreviewFile(null);
        setValue('docFile', url, { shouldValidate: true });
      } else {
        setPreviewUrl(null);
        setPreviewFile(null);
        setValue('docFile', null);
      }
      return customer;
    } else {
      setValue('tinNumber', '');
      setPreviewUrl(null);
      setPreviewFile(null);
      setValue('docFile', null);
      return null;
    }
  }, [setValue, loginUser, autoFillDocument]);

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
