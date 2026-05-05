import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/services/auth.service";
import { getWorkspaceById, getWorkspaceContents, getAllFolders } from "@/services/workspace.service";
import { getStorageUsage } from "@/services/file.service";
import { WorkspaceBreadcrumbs } from "@/components/workspace/breadcrumbs";
import { FileGrid } from "@/components/workspace/file-grid";
import { SearchBar } from "@/components/workspace/search-bar";
import { SortControls } from "@/components/workspace/sort-controls";
import { UploadDropzone } from "@/components/workspace/upload-dropzone";
import { CreateFolderButton } from "@/components/workspace/create-folder-button";
import { StorageWarning } from "@/components/workspace/storage-warning";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; sort?: string; order?: string }>;
}

export default async function WorkspacePage({ params, searchParams }: Props) {
  await requireAuth();
  const { id } = await params;
  const sp = await searchParams;

  const workspace = await getWorkspaceById(id);
  if (!workspace) redirect("/dashboard");

  const sortBy = sp.sort || "name";
  const sortOrder = (sp.order as "asc" | "desc") || "asc";

  const [contents, allFolders, usage] = await Promise.all([
    getWorkspaceContents(id, null, sortBy, sortOrder, sp.q),
    getAllFolders(id),
    getStorageUsage(id),
  ]);

  const basePath = `/workspace/${id}`;
  const isEmpty = contents.folders.length === 0 && contents.files.length === 0;

  const ownerName = workspace.profiles?.full_name ? `${workspace.profiles.full_name}'s Workspace` : workspace.name;
  return (
    <div className="space-y-6">
      <WorkspaceBreadcrumbs workspaceId={id} workspaceName={ownerName} items={[]} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Suspense fallback={null}>
              <SearchBar basePath={basePath} />
            </Suspense>
            <div className="flex items-center gap-2">
              <Suspense fallback={null}>
                <SortControls basePath={basePath} />
              </Suspense>
              <CreateFolderButton workspaceId={id} parentFolderId={null} />
            </div>
          </div>

          <UploadDropzone workspaceId={id} folderId={null} />
        </div>
        
        <div className="space-y-6">
          <StorageWarning usedBytes={usage.total_bytes} />
        </div>
      </div>

      <FileGrid
        folders={contents.folders}
        files={contents.files}
        allFolders={allFolders}
        workspaceId={id}
        currentFolderId={null}
        isEmpty={isEmpty}
        isSearch={!!sp.q}
      />
    </div>
  );
}
