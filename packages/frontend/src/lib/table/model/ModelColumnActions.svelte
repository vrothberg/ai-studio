<script lang="ts">
import type { ModelInfo } from '@shared/src/models/IModelInfo';
import { faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import ListItemButtonIcon from '../../button/ListItemButtonIcon.svelte';
import { studioClient } from '/@/utils/client';
export let object: ModelInfo;

function deleteModel() {
  studioClient.requestRemoveLocalModel(object.id).catch(err => {
    console.error(`Something went wrong while trying to delete model ${String(err)}.`);
  });
}

function openModelFolder() {
  if (object && object.file) {
    studioClient.openFile(object.file.path);
  }
}

function downloadModel() {
  if (object && object.file === undefined) {
    studioClient.downloadModel(object.id).catch((err: unknown) => {
      console.error(`Something went wrong while trying to download model ${object.id}`, err);
    });
  }
}
</script>

{#if object.file !== undefined}
  <ListItemButtonIcon
    icon="{faFolderOpen}"
    onClick="{() => openModelFolder()}"
    title="Open Model Folder"
    enabled="{!object.state}" />
  <ListItemButtonIcon icon="{faTrash}" onClick="{deleteModel}" title="Delete Model" enabled="{!object.state}" />
{:else}
  <ListItemButtonIcon icon="{faDownload}" onClick="{downloadModel}" title="Download Model" enabled="{!object.state}" />
{/if}
