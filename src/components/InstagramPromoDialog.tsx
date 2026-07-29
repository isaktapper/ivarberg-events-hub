import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/constants";

interface InstagramPromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClick: () => void;
}

// Popup-variant av Instagram-promon – öppnas när besökaren scrollat en bit i flödet.
export function InstagramPromoDialog({ open, onOpenChange, onClick }: InstagramPromoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sea-light text-sea">
            <Instagram className="h-6 w-6" />
          </div>
          <DialogTitle className="text-ink">Missa inget i Varberg</DialogTitle>
          <DialogDescription className="text-ink-soft">
            Följ oss på Instagram för dagliga eventtips och inspiration från Varberg.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <Button
            asChild
            className="w-full rounded-full bg-sea text-white hover:bg-sea-dark"
          >
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClick}
            >
              Följ {INSTAGRAM_HANDLE}
            </a>
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-full text-ink-soft hover:text-ink"
            onClick={() => onOpenChange(false)}
          >
            Nej tack
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
