import { UploadCloud } from "lucide-react";

const FileUploadBox = ({ label, file, setFile }) => {
  return (
    <div>
      <label className="text-xs uppercase font-bold text-gray-400 mb-2 block">
        {label}
      </label>

      <label className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#E00000] transition group">
        
        <UploadCloud className="text-gray-400 group-hover:text-[#E00000]" />

        <span className="text-sm mt-2 font-semibold text-gray-600">
          {file
  ? typeof file === "string"
    ? file.split("/").pop()   // show file name from URL
    : file.name
  : "Click to upload or drag file"}
        </span>

        <span className="text-xs text-gray-400 mt-1">
          PNG, JPG, PDF up to 5MB
        </span>

        <input
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>
    </div>
  );
};

export default FileUploadBox;