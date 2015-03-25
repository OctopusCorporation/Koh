using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Text;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Storage;

namespace CompressRT
{
    public sealed class UnCompresser
    {


        public IAsyncOperationWithProgress<int, double> Uncompress(StorageFile File, StorageFolder Destination)
        {
            return AsyncInfo.Run<int, double>((Token, Progress) =>
            {
                return Task.Run(async () =>
                {
                    Progress.Report(0);
                    await UnZipFile(File, Destination);
                    Token.ThrowIfCancellationRequested();
                    Progress.Report(100.0);
                    return 0;
                }, Token
                  );

            });
        }
        private async Task<bool> UnZipFile(StorageFile file, StorageFolder destination)
        {
            try
            {
                var folder = destination;
                string filename = file.DisplayName;
                Stream zipStream = await file.OpenStreamForReadAsync();
                char[] separators = new char[] { '.' };

                MemoryStream zipMemoryStream = new MemoryStream((int)zipStream.Length);

                await zipStream.CopyToAsync(zipMemoryStream);
                var storage = await folder.CreateFolderAsync(filename.Split(separators)[0], CreationCollisionOption.OpenIfExists);

                var archive = new ZipArchive(zipMemoryStream, ZipArchiveMode.Read);

                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    try
                    {
                        if (entry.Name == "")
                        {
                            // Folder
                            await CreateRecursiveFolder(storage, entry);
                        }
                        else
                        {
                            // File
                            await ExtractFile(storage, entry);
                        }
                    }

                    catch (Exception ex)
                    {
                        Debug.WriteLine(ex.Message);
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        private async Task CreateRecursiveFolder(StorageFolder folder, ZipArchiveEntry entry)
        {
            var steps = entry.FullName.Split('/').ToList();

            steps.RemoveAt(steps.Count() - 1);

            foreach (var i in steps)
            {
                try
                {
                    var NewFolder = await folder.CreateFolderAsync(i, CreationCollisionOption.OpenIfExists);


                }
                catch (Exception ex)
                {
                    var x = ex;
                }
            }
        }

        private async Task ExtractFile(StorageFolder folder, ZipArchiveEntry entry)
        {
            var steps = entry.FullName.Split('/').ToList();

            steps.RemoveAt(steps.Count() - 1);

            foreach (var i in steps)
            {
                folder = await folder.CreateFolderAsync(i, CreationCollisionOption.OpenIfExists);
            }

            using (Stream fileData = entry.Open())
            {
                StorageFile outputFile = await folder.CreateFileAsync(entry.Name, CreationCollisionOption.ReplaceExisting);

                using (Stream outputFileStream = await outputFile.OpenStreamForWriteAsync())
                {
                    await fileData.CopyToAsync(outputFileStream);
                    await outputFileStream.FlushAsync();
                }
            }
        }
    }
}
