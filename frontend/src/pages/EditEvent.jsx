import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        eventType: "normal",
        eligibility: "Open to all",
        registrationDeadline: "",
        startDate: "",
        endDate: "",
        registrationLimit: 0,
        registrationFee: 0,
        eventTags: "",
        location: "",
        merchandiseVariants: [],
        purchaseLimit: 1,
        status: "draft" // default
    });
    const [formFields, setFormFields] = useState([]);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/events/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();

            // Format dates for input[type="datetime-local"]
            const formatDate = (dateString) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            };

            setFormData({
                ...data,
                registrationDeadline: formatDate(data.registrationDeadline),
                startDate: formatDate(data.startDate),
                endDate: formatDate(data.endDate),
                eventTags: data.eventTags.join(", ")
            });
            setFormFields(data.formSchema || []);
            setVariants(data.merchandiseVariants || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching event:", error);
            alert("Failed to load event data");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addField = () => {
        setFormFields([...formFields, { label: "", type: "text", required: false, options: [] }]);
    };

    const handleFieldChange = (index, key, value) => {
        const updatedFields = [...formFields];
        updatedFields[index][key] = value;
        setFormFields(updatedFields);
    };

    const moveField = (index, direction) => {
        const updatedFields = [...formFields];
        if (direction === "up" && index > 0) {
            [updatedFields[index - 1], updatedFields[index]] = [updatedFields[index], updatedFields[index - 1]];
        } else if (direction === "down" && index < updatedFields.length - 1) {
            [updatedFields[index + 1], updatedFields[index]] = [updatedFields[index], updatedFields[index + 1]];
        }
        setFormFields(updatedFields);
    };

    const removeField = (index) => {
        const updatedFields = formFields.filter((_, i) => i !== index);
        setFormFields(updatedFields);
    };

    // Merchandise Variant Handlers
    const addVariant = () => {
        setVariants([...variants, { variantName: "", stock: 0 }]);
    };

    const handleVariantChange = (index, key, value) => {
        const updated = [...variants];
        updated[index][key] = value;
        setVariants(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const body = {
                ...formData,
                eventTags: formData.eventTags.split(",").map(tag => tag.trim()),
                formSchema: formFields,
                merchandiseVariants: variants
            };

            const response = await fetch(`http://localhost:5000/api/organizer/events/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update event");
            }

            alert("Event updated successfully!");
            navigate("/organizer-dashboard");
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    const isPublished = formData.status === 'published';
    const isLocked = formData.status === 'ongoing' || formData.status === 'closed';

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Edit Event: {formData.title}</h1>

            {isLocked && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">This event is {formData.status} and cannot be edited.</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Event Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} required className="p-2 border rounded bg-gray-50 disabled:bg-gray-200" disabled={isPublished || isLocked} />
                        {isPublished && <span className="text-xs text-red-500">Cannot edit title after publishing</span>}
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Event Type</label>
                        <select name="eventType" value={formData.eventType} onChange={handleChange} className="p-2 border rounded bg-gray-50 disabled:bg-gray-200" disabled={true}>
                            <option value="normal">Normal Event</option>
                            <option value="merchandise">Merchandise</option>
                        </select>
                        <span className="text-xs text-gray-500">Event type cannot be changed</span>
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full p-2 border rounded h-32 disabled:bg-gray-200" disabled={isLocked} />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Registration Deadline</label>
                        <input type="datetime-local" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required className="p-2 border rounded disabled:bg-gray-200" disabled={isLocked} />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Event Start Date</label>
                        <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required className="p-2 border rounded disabled:bg-gray-200" disabled={isPublished || isLocked} />
                        {isPublished && <span className="text-xs text-red-500">Cannot edit dates after publishing</span>}
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Event End Date</label>
                        <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required className="p-2 border rounded disabled:bg-gray-200" disabled={isPublished || isLocked} />
                        {isPublished && <span className="text-xs text-red-500">Cannot edit dates after publishing</span>}
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Registration Limit</label>
                        <input type="number" name="registrationLimit" value={formData.registrationLimit} onChange={handleChange} className="p-2 border rounded disabled:bg-gray-200" disabled={isLocked} />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} required className="p-2 border rounded disabled:bg-gray-200" disabled={isLocked} />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Eligibility</label>
                        <select name="eligibility" value={formData.eligibility} onChange={handleChange} className="p-2 border rounded disabled:bg-gray-200" disabled={isLocked}>
                            <option value="Open to all">Open to all</option>
                            <option value="IIIT Only">IIIT Only</option>
                        </select>
                    </div>
                </div>

                {/* Additional Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Registration Fee (₹)</label>
                        <input type="number" name="registrationFee" value={formData.registrationFee} onChange={handleChange} className="p-2 border rounded disabled:bg-gray-200" disabled={isPublished || isLocked} />
                        {isPublished && <span className="text-xs text-red-500">Cannot edit fees after publishing</span>}
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Event Tags</label>
                        <input type="text" name="eventTags" value={formData.eventTags} onChange={handleChange} className="p-2 border rounded disabled:bg-gray-200" disabled={isLocked} />
                    </div>

                    {formData.eventType === "merchandise" && (
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-gray-700">Purchase Limit</label>
                            <input type="number" name="purchaseLimit" value={formData.purchaseLimit} onChange={handleChange} className="p-2 border rounded disabled:bg-gray-200" disabled={isLocked} />
                        </div>
                    )}
                </div>

                {/* Dynamic Form Builder */}
                {formData.eventType === "normal" && (
                    <div className="border p-4 rounded bg-gray-50">
                        <h3 className="font-semibold mb-2">Registration Form Builder</h3>
                        {!isLocked ? formFields.map((field, index) => (
                            <div key={index} className="flex flex-col gap-2 mb-4 border-b pb-2 border-gray-200">
                                <div className="flex gap-2 items-center">
                                    <button type="button" onClick={() => moveField(index, "up")} disabled={index === 0} className="text-gray-500 hover:text-blue-600 disabled:opacity-30">↑</button>
                                    <button type="button" onClick={() => moveField(index, "down")} disabled={index === formFields.length - 1} className="text-gray-500 hover:text-blue-600 disabled:opacity-30">↓</button>

                                    <input placeholder="Field Label" value={field.label} onChange={(e) => handleFieldChange(index, "label", e.target.value)} className="p-1 border rounded flex-1" />
                                    <select value={field.type} onChange={(e) => handleFieldChange(index, "type", e.target.value)} className="p-1 border rounded w-32">
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="dropdown">Dropdown</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="file">File Upload</option>
                                    </select>
                                    <label className="flex items-center text-sm">
                                        <input type="checkbox" checked={field.required} onChange={(e) => handleFieldChange(index, "required", e.target.checked)} className="mr-1" />
                                        Req
                                    </label>
                                    <button type="button" onClick={() => removeField(index)} className="text-red-500 hover:text-red-700 ml-2">✖</button>
                                </div>
                                {(field.type === 'dropdown' || field.type === 'checkbox') && (
                                    <div className="ml-10">
                                        <input
                                            placeholder="Options (comma separated)"
                                            value={field.options ? field.options.join(", ") : ""}
                                            onChange={(e) => handleFieldChange(index, "options", e.target.value.split(",").map(opt => opt.trim()))}
                                            className="p-1 border rounded w-full text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="space-y-2">
                                <p className="text-orange-600 text-sm font-bold mb-2">Form Schema is locked due to existing registrations or event status.</p>
                                {formFields.map((field, index) => (
                                    <div key={index} className="p-2 border rounded bg-gray-100 flex justify-between">
                                        <span className="font-medium">{field.label}</span>
                                        <span className="text-gray-500 text-sm">{field.type} {field.required ? '(Required)' : ''}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLocked && <button type="button" onClick={addField} className="text-blue-600 text-sm font-bold">+ Add Field</button>}
                    </div>
                )}

                {/* Merchandise Variants */}
                {formData.eventType === "merchandise" && (
                    <div className="border p-4 rounded bg-gray-50">
                        <h3 className="font-semibold mb-2">Merchandise Variants</h3>
                        {!isLocked ? variants.map((v, index) => (
                            <div key={index} className="flex flex-col gap-2 mb-4 border-b pb-2">
                                <div className="flex gap-2">
                                    <input placeholder="Name" value={v.variantName} onChange={(e) => handleVariantChange(index, "variantName", e.target.value)} className="p-1 border rounded flex-1" />
                                    <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => handleVariantChange(index, "stock", e.target.value)} className="p-1 border rounded w-24" />
                                </div>
                                <div className="flex gap-2">
                                    <input placeholder="Color" value={v.color || ""} onChange={(e) => handleVariantChange(index, "color", e.target.value)} className="p-1 border rounded flex-1" />
                                    <input placeholder="Size" value={v.size || ""} onChange={(e) => handleVariantChange(index, "size", e.target.value)} className="p-1 border rounded w-24" />
                                </div>
                            </div>
                        )) : <p className="text-gray-500 text-sm">Variants cannot be edited.</p>}
                        {!isLocked && <button type="button" onClick={addVariant} className="text-blue-600 text-sm">+ Add Variant</button>}
                    </div>
                )}

                {!isLocked && (
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Update Event</button>
                )}
            </form >
        </div >
    );
};

export default EditEvent;
