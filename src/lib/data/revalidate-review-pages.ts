import { revalidatePath } from "next/cache";

export const revalidateReviewPages = (
  metadataId?: string,
  programId?: string,
): void => {
  revalidatePath("/admin/reviews/programs");
  revalidatePath("/admin");

  if (metadataId) {
    revalidatePath(`/admin/reviews/programs/${metadataId}`);
  }

  if (programId) {
    revalidatePath(`/programs/${programId}`);
  }
};
