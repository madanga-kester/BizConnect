export function canAutoplayVideo(isActive: boolean, autoplayEnabled: boolean, reducedData: boolean): boolean {
  return isActive && autoplayEnabled && !reducedData;
}

export function resolveActiveVideoId<T extends { id: string }>(items: readonly T[], visibleVideoId: string | null): string | null {
  return visibleVideoId !== null && items.some((item) => item.id === visibleVideoId)
    ? visibleVideoId
    : null;
}
