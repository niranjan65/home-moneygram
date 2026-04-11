
// import React, { useEffect, useState } from 'react';
// import { User, Mail, Phone, Edit3 } from 'lucide-react';



// export const SenderCard = ({ sender }) => {

//   const [userDetail, setUserDetail] = useState(null)
//   const API_URL =
//   "https://mhmoneyexpress.anantdv.com/api/method/frappe.auth.get_logged_user";

// const HEADERS = {
//   "Content-Type": "application/json",
//   Authorization: "token 661457e17b8612a:5a5fb35fb41cc58",
// };

// async function fetchCurrentUser () {
//   const response = await fetch(API_URL, {
//     method: "GET",
//     headers: HEADERS,
//     credentials: "include",
//   });

//   const result = await response.json();
//   return result.message || {};
// }

//   useEffect(() => {
//   let mounted = true;

//   fetchCurrentUser().then(data => {
//     if (mounted) setUserDetail(data);
//   });

//   return () => mounted = false;
// }, []);
  
//   return (
//     // Fixed: changed 'class' to 'className' throughout the component
//     <div className="rounded-2xl border border-gray-200 bg-white  overflow-hidden shadow-sm hover:shadow-md transition-shadow">
//       <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50  bg-gray-50/50 ">
//         <h3 className="text-gray-900  font-extrabold text-base flex items-center gap-2">
//           <User size={18} className="text-primary" />
//           Sender Information
//         </h3>
//         <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 uppercase tracking-wider">
//           <Edit3 size={14} />
//           Edit
//         </button>
//       </div>
//       <div className="px-6 py-5 flex flex-wrap gap-x-12 gap-y-4">
//         <div className="flex flex-col gap-1">
//           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</span>
//           <span className="text-sm font-bold text-gray-900 ">{userDetail?.full_name}</span>
//         </div>
//         <div className="flex flex-col gap-1">
//           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</span>
//           <span className="text-sm font-bold text-gray-900 ">{userDetail?.email}</span>
//         </div>
//         <div className="flex flex-col gap-1">
//           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</span>
//           <span className="text-sm font-bold text-gray-900 ">{userDetail?.phone || "Not Available"}</span>
//         </div>
//       </div>
//     </div>
//   );
// };





import React from "react";
import { User, Edit3 } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";


export const SenderCard = () => {
  const { user, loading, error } = useCurrentUser();

  if (loading) {
    return <div className="p-6">Loading user...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Failed to load user</div>;
  }

  console.log("Current user data:", user); // Debug log to check user data

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
        <h3 className="text-gray-900 font-extrabold text-base flex items-center gap-2">
          <User size={18} className="text-primary" />
          Teller Information
        </h3>

        {/* <button className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 uppercase tracking-wider">
          <Edit3 size={14} />
          Edit
        </button> */}
      </div>

      <div className="px-6 py-5 flex flex-wrap gap-x-12 gap-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Full Name
          </span>
          <span className="text-sm font-bold text-gray-900">
            {user?.full_name || "Unknown User"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Email Address
          </span>
          <span className="text-sm font-bold text-gray-900">
            {user?.email || "Not Available"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Mobile Number
          </span>
          <span className="text-sm font-bold text-gray-900">
            {user?.mobile_no || "Not Available"}
          </span>
        </div>
      </div>
    </div>
  );
};
