export class GetItemDownloadUrlResDto {
  url: string;
  fileName: string;
}

export class GetAlbumDownloadUrlsResDto {
  albumTitle: string;
  files: GetItemDownloadUrlResDto[];
}
