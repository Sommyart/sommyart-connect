import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

type Props = {
  imageUrl: string | null;
  kind: "avatar" | "cover";
  busy: boolean;
  onCancel: () => void;
  onConfirm: (area: Area) => void;
};

export function PhotoCropDialog({ imageUrl, kind, busy, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const aspect = kind === "avatar" ? 1 : 16 / 9;

  return (
    <Dialog open={Boolean(imageUrl)} onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-3xl p-4">
        <DialogHeader>
          <DialogTitle>{kind === "avatar" ? "Crop profile photo" : "Crop cover photo"}</DialogTitle>
          <DialogDescription>Drag to position the image, then adjust the zoom.</DialogDescription>
        </DialogHeader>
        {imageUrl && (
          <div className={`bg-muted relative w-full overflow-hidden rounded-2xl ${kind === "avatar" ? "aspect-square" : "aspect-video"}`}>
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={kind === "avatar" ? "round" : "rect"}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_croppedArea, pixels) => setArea(pixels)}
            />
          </div>
        )}
        <div className="px-1">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">Zoom</p>
          <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={(value) => setZoom(value[0] ?? 1)} />
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button className="flex-1 rounded-2xl" variant="secondary" disabled={busy} onClick={onCancel}>Cancel</Button>
          <Button className="flex-1 rounded-2xl" disabled={!area || busy} onClick={() => area && onConfirm(area)}>
            {busy ? "Uploading…" : "Use photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}