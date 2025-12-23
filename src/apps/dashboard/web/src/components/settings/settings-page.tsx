import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { type Id } from "api/data-model";
import { useSettings, useFAQs, useUpdateSettings, useCreateFAQ, useUpdateFAQ, useDeleteFAQ } from "@/hooks/use-convex-queries";

export function SettingsPage() {
  const { data: settings } = useSettings();
  const { data: faqs = [] } = useFAQs();
  const updateSettings = useUpdateSettings();
  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();

  const [locationLink, setLocationLink] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [tiktokLink, setTiktokLink] = useState("");

  const [faqsList, setFaqsList] = useState<
    Array<{ _id: Id<"faqs">; question: string; answer: string; order: number }>
  >([]);
  const [editingFaq, setEditingFaq] = useState<Id<"faqs"> | null>(null);
  const [editingFaqQuestion, setEditingFaqQuestion] = useState("");
  const [editingFaqAnswer, setEditingFaqAnswer] = useState("");
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");

  useEffect(() => {
    if (settings) {
      setLocationLink(settings.locationLink || "");
      setInstagramLink(settings.instagramLink || "");
      setFacebookLink(settings.facebookLink || "");
      setTiktokLink(settings.tiktokLink || "");
    }
  }, [settings]);

  useEffect(() => {
    if (faqs) {
      setFaqsList(faqs);
    }
  }, [faqs]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        locationLink: locationLink || undefined,
        instagramLink: instagramLink || undefined,
        facebookLink: facebookLink || undefined,
        tiktokLink: tiktokLink || undefined,
      });
      toast.success("Paramètres enregistrés avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement des paramètres");
    }
  };

  const handleAddFAQ = async () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      toast.error("Veuillez remplir la question et la réponse");
      return;
    }
    try {
      const maxOrder =
        faqsList.length > 0 ? Math.max(...faqsList.map((f) => f.order)) : 0;
      await createFAQ.mutateAsync({
        question: newFaqQuestion,
        answer: newFaqAnswer,
        order: maxOrder + 1,
      });
      setNewFaqQuestion("");
      setNewFaqAnswer("");
      toast.success("FAQ ajoutée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la FAQ");
    }
  };

  const handleUpdateFAQ = async (id: Id<"faqs">) => {
    try {
      await updateFAQ.mutateAsync({
        id,
        question: editingFaqQuestion,
        answer: editingFaqAnswer,
      });
      setEditingFaq(null);
      setEditingFaqQuestion("");
      setEditingFaqAnswer("");
      toast.success("FAQ mise à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la FAQ");
    }
  };

  const handleStartEdit = (faq: {
    _id: Id<"faqs">;
    question: string;
    answer: string;
    order: number;
  }) => {
    setEditingFaq(faq._id);
    setEditingFaqQuestion(faq.question);
    setEditingFaqAnswer(faq.answer);
  };

  const handleCancelEdit = () => {
    setEditingFaq(null);
    setEditingFaqQuestion("");
    setEditingFaqAnswer("");
  };

  const handleDeleteFAQ = async (id: Id<"faqs">) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) return;
    try {
      await deleteFAQ.mutateAsync({ id });
      toast.success("FAQ supprimée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression de la FAQ");
    }
  };

  return (
    <div className="p-4 pt-0 w-full h-full flex flex-col gap-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle>Liens des réseaux sociaux</CardTitle>
          <CardDescription>
            Configurez les liens vers vos réseaux sociaux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={instagramLink}
              onChange={(e) => setInstagramLink(e.target.value)}
              placeholder="https://instagram.com/votre-compte"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={facebookLink}
              onChange={(e) => setFacebookLink(e.target.value)}
              placeholder="https://facebook.com/votre-page"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              value={tiktokLink}
              onChange={(e) => setTiktokLink(e.target.value)}
              placeholder="https://tiktok.com/@votre-compte"
            />
          </div>
          <Button onClick={handleSaveSettings}>Enregistrer les liens</Button>
        </CardContent>
      </Card>

      {/* Location Link */}
      <Card>
        <CardHeader>
          <CardTitle>Lien de localisation</CardTitle>
          <CardDescription>
            Lien vers Google Maps ou autre service de localisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Lien de localisation</Label>
            <Input
              id="location"
              value={locationLink}
              onChange={(e) => setLocationLink(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <Button onClick={handleSaveSettings}>Enregistrer le lien</Button>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Questions fréquentes (FAQ)</CardTitle>
          <CardDescription>
            Gérez les questions fréquentes affichées sur votre site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new FAQ */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Ajouter une nouvelle FAQ</h3>
            <div className="space-y-2">
              <Label htmlFor="new-faq-question">Question</Label>
              <Input
                id="new-faq-question"
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
                placeholder="Quelle est votre question ?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-faq-answer">Réponse</Label>
              <Textarea
                id="new-faq-answer"
                value={newFaqAnswer}
                onChange={(e) => setNewFaqAnswer(e.target.value)}
                placeholder="Réponse à la question..."
                rows={4}
              />
            </div>
            <Button onClick={handleAddFAQ}>Ajouter la FAQ</Button>
          </div>

          {/* Existing FAQs */}
          <div className="space-y-4">
            <h3 className="font-semibold">FAQs existantes</h3>
            {faqsList.length === 0 ? (
              <p className="text-muted-foreground">Aucune FAQ pour le moment</p>
            ) : (
              faqsList.map((faq) => (
                <div key={faq._id} className="p-4 border rounded-lg space-y-3">
                  {editingFaq === faq._id ? (
                    <>
                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Input
                          value={editingFaqQuestion}
                          onChange={(e) =>
                            setEditingFaqQuestion(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Réponse</Label>
                        <Textarea
                          value={editingFaqAnswer}
                          onChange={(e) => setEditingFaqAnswer(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdateFAQ(faq._id)}>
                          Enregistrer
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Annuler
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">{faq.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(faq)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteFAQ(faq._id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
