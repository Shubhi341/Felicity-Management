import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateEvent = () => {
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
        location: "", // Added location
        merchandiseVariants: [],
        purchaseLimit: 1
    });
    const [formFields, setFormFields] = useState([]);
    const [variants, setVariants] = useState([{ variantName: "", stock: 0 }]); // Local state for variants

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
                ...formData,
                eventTags: formData.eventTags.split(",").map(tag => tag.trim()),
                formSchema: formFields,
                merchandiseVariants: variants // Include variants
            };

            const response = await fetch("http://localhost:5000/api/organizer/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create event");
            }

            alert("Event created successfully!");
            navigate("/organizer-dashboard");
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Create New Event</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="title" placeholder="Event Title" onChange={handleChange} required className="p-2 border rounded" />
                    <select name="eventType" onChange={handleChange} className="p-2 border rounded">
                        <option value="normal">Normal Event</option>
                        <option value="merchandise">Merchandise</option>
                    </select>
                    <input name="description" placeholder="Description" onChange={handleChange} required className="p-2 border rounded md:col-span-2" />
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600">Registration Deadline</label>
                        <input type="datetime-local" name="registrationDeadline" onChange={handleChange} required className="p-2 border rounded" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600">Event Start Date</label>
                        <input type="datetime-local" name="startDate" onChange={handleChange} required className="p-2 border rounded" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600">Event End Date</label>
                        <input type="datetime-local" name="endDate" onChange={handleChange} required className="p-2 border rounded" />
                    </div>
                    <input type="number" name="registrationLimit" placeholder="Limit (0 for unlimited)" onChange={handleChange} className="p-2 border rounded" />
                    <input type="text" name="location" placeholder="Location" onChange={handleChange} required className="p-2 border rounded" />
                    <input type="text" name="location" placeholder="Location" onChange={handleChange} required className="p-2 border rounded" />
                    <select name="eligibility" onChange={handleChange} className="p-2 border rounded">
                        <option value="Open to all">Open to all</option>
                        <option value="IIIT Only">IIIT Only</option>
                    </select>
                </div>

                {/* Additional Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600">Registration Fee (₹)</label>
                        <input type="number" name="registrationFee" placeholder="0" onChange={handleChange} className="p-2 border rounded" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600">Event Tags (comma separated)</label>
                        <input type="text" name="eventTags" placeholder="Tech, Cultural, Workshop..." onChange={handleChange} className="p-2 border rounded" />
                    </div>
                    {formData.eventType === "merchandise" && (
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600">Purchase Limit (per user)</label>
                            <input type="number" name="purchaseLimit" placeholder="1" onChange={handleChange} className="p-2 border rounded" />
                        </div>
                    )}
                </div>

                {/* Dynamic Form Builder (Only for Normal Events) */}
                {formData.eventType === "normal" && (
                    <div className="border p-4 rounded bg-gray-50">
                        <h3 className="font-semibold mb-2">Registration Form Builder</h3>
                        {formFields.map((field, index) => (
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
                        ))}
                        <button type="button" onClick={addField} className="text-blue-600 text-sm font-bold">+ Add Field</button>
                    </div>
                )}

                {/* Merchandise Variants Builder */}
                {
                    formData.eventType === "merchandise" && (
                        <div className="border p-4 rounded bg-gray-50">
                            <h3 className="font-semibold mb-2">Merchandise Variants</h3>
                            {variants.map((v, index) => (
                                <div key={index} className="flex flex-col gap-2 mb-4 border-b pb-2">
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="Item Name (e.g. Hoodie)"
                                            value={v.variantName}
                                            onChange={(e) => handleVariantChange(index, "variantName", e.target.value)}
                                            className="p-1 border rounded flex-1"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Stock"
                                            value={v.stock}
                                            onChange={(e) => handleVariantChange(index, "stock", e.target.value)}
                                            className="p-1 border rounded w-24"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="Color (e.g. Black)"
                                            value={v.color || ""}
                                            onChange={(e) => handleVariantChange(index, "color", e.target.value)}
                                            className="p-1 border rounded flex-1"
                                        />
                                        <input
                                            placeholder="Size (e.g. L)"
                                            value={v.size || ""}
                                            onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                                            className="p-1 border rounded w-24"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addVariant} className="text-blue-600 text-sm">+ Add Variant</button>
                        </div>
                    )
                }

                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create Event (Draft)</button>
            </form >
        </div >
    );
};

export default CreateEvent;
