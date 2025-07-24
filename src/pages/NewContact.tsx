import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Tag, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { dbOperations } from "../db/database";
import { ProfilePicture } from "../components/ProfilePicture";

export const NewContact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    tags: "",
    birthday: "",
    profilePicture: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddContact = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required!");
      return;
    }

    setIsLoading(true);
    try {
      const contactId = await dbOperations.addContact({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        birthday: formData.birthday ? new Date(formData.birthday) : undefined,
        profilePicture: formData.profilePicture || undefined,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        customFields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isFavorite: false,
      });
      toast.success("Contact added successfully!");
      
      // Add a small delay to ensure database operation completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate back to contact list first to ensure it updates
      navigate("/");
      
      // Then navigate to the contact detail after a brief moment
      setTimeout(() => {
        navigate(`/contact/${contactId}`);
      }, 200);
    } catch (error) {
      toast.error("Failed to add contact");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in mobile-content-safe">
      <div className="mb-8">
        <h1 className="section-header gradient-text">Add New Contact</h1>
        <p className="text-slate-600 dark:text-slate-400">Create a new contact with their information</p>
      </div>

      <div className="card p-8 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center space-y-4 pb-6 border-b border-slate-200 dark:border-slate-700">
          <ProfilePicture
            profilePicture={formData.profilePicture}
            name={formData.name || "New Contact"}
            size="xlarge"
            editable
            onImageChange={(imageData) => handleInputChange('profilePicture', imageData || '')}
          />
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Click to add a profile picture
          </p>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <User className="w-4 h-4" />
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            placeholder="Enter full name"
            className="input w-full"
            required
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Mail className="w-4 h-4" />
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            placeholder="Enter email address"
            className="input w-full"
          />
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Phone className="w-4 h-4" />
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={e => handleInputChange('phone', e.target.value)}
            placeholder="Enter phone number"
            className="input w-full"
          />
        </div>

        {/* Birthday Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Tag className="w-4 h-4" />
            Birthday
          </label>
          <input
            type="date"
            value={formData.birthday}
            onChange={e => handleInputChange('birthday', e.target.value)}
            className="input w-full"
          />
        </div>

        {/* Tags Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Tag className="w-4 h-4" />
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={e => handleInputChange('tags', e.target.value)}
            placeholder="Enter tags separated by commas"
            className="input w-full"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Example: friend, work, family
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button 
            onClick={handleAddContact} 
            disabled={isLoading || !formData.name.trim()}
            className="btn-primary px-6 py-3 flex items-center gap-2 flex-1"
          >
            <Save className="w-4 h-4" />
            {isLoading ? "Adding..." : "Add Contact"}
          </button>
          <button 
            onClick={handleCancel}
            className="btn-secondary px-6 py-3 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

