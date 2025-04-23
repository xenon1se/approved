import { ContentForm } from "@/components/content-generation/content-form";

export default function ContentGeneration() {
  return (
    <section className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Content Generation</h2>
        <p className="text-slate-600">Generate SEO-optimized content for your logistics blog and social media</p>
      </div>
      
      <ContentForm />
    </section>
  );
}
