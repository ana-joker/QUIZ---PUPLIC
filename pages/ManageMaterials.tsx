import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { api } from '../services/api';

// Types should be centralized
interface Material {
    id: string;
    title: string;
    fileKey: string;
    size: number;
}

const ManageMaterials: React.FC = () => {
    const { id: courseId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [courseTitle, setCourseTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const fetchMaterials = useCallback(async () => {
        if (!courseId) return;
        try {
            // Assuming an endpoint to get course details including materials
            const response = await api.get(`/api/teacher/courses/${courseId}`);
            setMaterials(response.data.course.materials || []);
            setCourseTitle(response.data.course.title || 'Course');
        } catch (err) {
            setError('Failed to load materials.');
        }
    }, [courseId]);

    useEffect(() => {
        setLoading(true);
        fetchMaterials().finally(() => setLoading(false));
    }, [fetchMaterials]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
            setTitle(acceptedFiles[0].name.replace(/\.pdf$/i, '')); // Pre-fill title
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

    const handleUpload = async () => {
        if (!file || !courseId) return;
        setIsUploading(true);
        setUploadProgress(0);
        setError('');

        try {
            // 1. Get presigned URL
            const presignRes = await api.post('/api/teacher/materials/presign', { courseId, filename: file.name, contentType: file.type });
            const { uploadUrl, fileKey } = presignRes.data;

            // 2. Upload file to R2 with progress
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl);
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        setUploadProgress(percentComplete);
                    }
                };
                xhr.onload = () => {
                    if (xhr.status < 300) resolve();
                    else reject(new Error(`Upload failed with status: ${xhr.status}`));
                };
                xhr.onerror = () => reject(new Error('Network error during upload.'));
                xhr.send(file);
            });

            // 3. Commit the file
            await api.post('/api/teacher/materials/commit', { courseId, title, fileKey, size: file.size });

            // Success
            await fetchMaterials(); // Refresh list
            setFile(null);
            setTitle('');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Upload process failed.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (materialId: string) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            try {
                await api.delete(`/api/teacher/materials/${materialId}`);
                setMaterials(materials.filter(m => m.id !== materialId));
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete material.');
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <button onClick={() => navigate('/teacher-dashboard')} className="text-purple-400 mb-4">← Back to Dashboard</button>
            <h1 className="text-4xl font-bold text-slate-100">Manage Materials</h1>
            <p className="text-slate-400 mb-8">For course: {courseTitle}</p>

            {/* Upload Form */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Upload New Material</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div {...getRootProps()} className="p-6 border-2 border-dashed border-slate-600 rounded-lg text-center cursor-pointer hover:border-purple-500">
                        <input {...getInputProps()} />
                        <p>Drag 'n' drop a PDF, or click to select</p>
                    </div>
                    <div>
                        {file && <p className="text-sm text-slate-300 mb-2">Selected: {file.name}</p>}
                        <input type="text" placeholder="Material Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-3 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4" />
                        <button onClick={handleUpload} disabled={isUploading || !file || !title} className="w-full py-2 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50">{isUploading ? `Uploading... ${uploadProgress.toFixed(0)}%` : 'Upload'}</button>
                    </div>
                </div>
                {isUploading && <div className="w-full bg-slate-700 rounded-full h-2.5 mt-4"><div className="bg-purple-600 h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>}
            </div>

            {/* Materials List */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                 <h2 className="text-2xl font-bold text-purple-400 mb-4">Uploaded Materials</h2>
                 {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : (
                     <ul className="space-y-3">
                         {materials.length > 0 ? materials.map(m => (
                             <li key={m.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                                 <span>{m.title}</span>
                                 <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-400">Delete</button>
                             </li>
                         )) : <p className="text-slate-400">No materials uploaded yet.</p>}
                     </ul>
                 )}
            </div>
        </div>
    );
};

export default ManageMaterials;
