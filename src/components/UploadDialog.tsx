import React, { ChangeEvent, DragEvent, useState } from 'react';

interface UploadDialogProps {
  onPublish: (params: {
    file?: File | null;
    imageUrl?: string;
    caption: string;
    location?: string;
    filterCss?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const PHOTO_FILTERS = [
  { name: 'Normal', css: 'none' },
  { name: 'Clarendon', css: 'contrast(1.2) saturate(1.25)' },
  { name: 'Moon', css: 'grayscale(1) contrast(1.1) brightness(1.05)' },
  { name: 'Crema', css: 'sepia(0.25) contrast(1.05) saturate(1.1)' },
  { name: 'Vintage', css: 'sepia(0.3) brightness(0.95) contrast(0.9)' },
  { name: 'Drama', css: 'contrast(1.35) saturate(1.15)' },
];

const CURATED_PRESETS = [
  {
    name: 'Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Minimalist perspective study in concrete and shadow.',
    location: 'San Francisco, CA',
  },
  {
    name: 'Espresso',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    caption: 'Morning pour over ritual in the neighborhood roastery.',
    location: 'Kyoto, Japan',
  },
  {
    name: 'Ceramics',
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    caption: 'Raw terracotta vessels fresh off the pottery wheel.',
    location: 'Big Sur Craft Studio',
  },
  {
    name: 'Coastal',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Tides receding at sunset. The natural gradients never need retouching.',
    location: 'Mendocino, CA',
  },
];

export const UploadDialog: React.FC<UploadDialogProps> = ({
  onPublish,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState(PHOTO_FILTERS[0]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (chosen) {
      if (!chosen.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setError(null);
      setFile(chosen);
      setPreview(URL.createObjectURL(chosen));
    }
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.type.startsWith('image/')) {
        setError('Please drop a valid image file.');
        return;
      }
      setError(null);
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
    }
  };

  const selectPreset = (preset: (typeof CURATED_PRESETS)[0]) => {
    setFile(null);
    setPreview(preset.url);
    setSelectedFilter(PHOTO_FILTERS[0]);
    if (!caption) setCaption(preset.caption);
    if (!location) setLocation(preset.location);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) {
      setError('Please choose or upload a photo first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onPublish({
        file,
        imageUrl: preview.startsWith('blob:') ? undefined : preview,
        caption,
        location,
        filterCss: selectedFilter.css,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 540 }}>
        <div className="app-dialog-header">
          <div>
            <p className="kicker">New moment</p>
            <h2>Create a post</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="app-dialog-body" onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fbeae8',
                color: '#ad4938',
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Quick Preset Selector for Interview Testing */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
              Quick test sample photography:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CURATED_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => selectPreset(p)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid var(--line)',
                    background: preview === p.url ? 'var(--mint)' : 'var(--paper)',
                    color: 'var(--ink)',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Upload or Drop Area */}
          {!preview ? (
            <label
              className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              style={{ cursor: 'pointer', border: '2px dashed var(--line)', borderRadius: 12 }}
            >
              <i className="fa-regular fa-image" />
              <strong>Drop your photo here, or click to browse</strong>
              <p>Supports JPEG, PNG, WebP up to 10MB</p>
              <input
                name="image"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div style={{ marginBottom: 18 }}>
              <div style={{ position: 'relative' }}>
                <img
                  className="upload-preview"
                  src={preview}
                  alt="Post preview"
                  style={{
                    width: '100%',
                    maxHeight: 320,
                    objectFit: 'cover',
                    borderRadius: 10,
                    filter: selectedFilter.css,
                    transition: 'filter 0.25s ease',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview('');
                    setSelectedFilter(PHOTO_FILTERS[0]);
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                  title="Remove photo"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {/* Instagram Photo Filters Carousel */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Photo Filter Preset
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {PHOTO_FILTERS.map((f) => (
                    <button
                      type="button"
                      key={f.name}
                      onClick={() => setSelectedFilter(f)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        border: '1px solid var(--line)',
                        background: selectedFilter.name === f.name ? 'var(--ink)' : 'var(--paper)',
                        color: selectedFilter.name === f.name ? 'white' : 'var(--ink)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <textarea
              name="caption"
              maxLength={500}
              placeholder="Write a caption... (e.g. #minimalism #light)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                fontSize: 12,
                minHeight: 80,
              }}
            />

            <input
              name="location"
              placeholder="Add location (e.g. San Francisco, CA)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                fontSize: 12,
              }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                className="share-btn"
                type="submit"
                disabled={isSubmitting || !preview}
                style={{ opacity: isSubmitting || !preview ? 0.6 : 1 }}
              >
                {isSubmitting ? (
                  'Publishing moment...'
                ) : (
                  <>
                    Share moment <i className="fa-solid fa-arrow-right" />
                  </>
                )}
              </button>
              <button className="button-outline" type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
