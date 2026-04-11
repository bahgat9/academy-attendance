import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FaceEnrollmentCamera } from "@/components/camera/face-enrollment-camera";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function EnrollPlayerFacePage({ params }: PageProps) {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();

    const { data: player } = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

    if (!player) {
        notFound();
    }

    return (
        <AppShell title="Face Enrollment" subtitle={player.full_name}>
            <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <h2 className="font-medium">{player.full_name}</h2>
                    <p className="mt-1 text-sm text-white/55">
                        {player.age_group || "No age group"}
                    </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="font-medium">Instructions</h3>
                    <div className="mt-3 space-y-2 text-sm text-white/60">
                        <p>Use one face only in the frame.</p>
                        <p>Keep the face inside the guide area.</p>
                        <p>Capture the guided positions one by one.</p>
                        <p>Use clear light and avoid strong shadows.</p>
                        <p>For young players, capture calm and natural poses.</p>
                    </div>
                </div>

                <FaceEnrollmentCamera playerId={player.id} sampleTarget={5} />
            </div>
        </AppShell>
    );
}