
#include <stdio.h>
#include <string.h>
#include <windows.h>
#include <iostream>
using namespace std;
#pragma comment(lib, "shell32.lib")

#include "miniz.c"

#define __RELEASE__ 1

#ifndef __DEBUG__
// hide console windows
#pragma comment(linker, "/subsystem:windows /ENTRY:mainCRTStartup")
#endif

typedef unsigned char uint8;
typedef unsigned short uint16;
typedef unsigned int uint;

string zipPath = "./update.zip";
string unzipPath = "./update/";
wchar_t copySourcePath[] = L"./update/*\0";
wchar_t copyTargetPath[] = L"";

#define _PROGRAM_RUNNING_ 0x4C8;

void delFile(string path)
{
	string cmd = "";
	cmd = "del \"" + path + "\"";
	system(cmd.c_str());
}

void rmDir(string path)
{
	string cmd = "";
	cmd = "rmdir /s/q \"" + path + "\"";
	system(cmd.c_str());
}

void mkDir(string path)
{
	string cmd = "";
	cmd = "mkdir \"" + path + "\"";
	system(cmd.c_str());
}

int touchFile(string path, void *p, uint size)
{
	int res = EXIT_SUCCESS;
	FILE *pFile;
	if (fopen_s(&pFile, path.c_str(), "wb") == 0)
	{
		fwrite(p, sizeof(char), size, pFile);
		fclose(pFile);
	}
	else
	{
		res = EXIT_FAILURE;
	}

	return res;
}

int unzipUpdateFile()
{
	rmDir(unzipPath);
	mkDir(unzipPath);

	mz_bool status;
	size_t uncomp_size;
	mz_zip_archive zip_archive;
	void *p;

	memset(&zip_archive, 0, sizeof(zip_archive));
	status = mz_zip_reader_init_file(&zip_archive, zipPath.c_str(), 0);
	if (!status)
	{
		printf("mz_zip_reader_init_file() failed!\n");
		system("pause"); return EXIT_FAILURE;
	}

	for (int i = 0; i < (int)mz_zip_reader_get_num_files(&zip_archive); i++)
	{
		mz_zip_archive_file_stat file_stat;
		if (!mz_zip_reader_file_stat(&zip_archive, i, &file_stat))
		{
			printf("mz_zip_reader_file_stat() failed! - %s\n", file_stat.m_filename);
			mz_zip_reader_end(&zip_archive);
			system("pause"); return EXIT_FAILURE;
		}

		string filename(file_stat.m_filename);
		string filePath = unzipPath + filename;

		if (mz_zip_reader_is_file_a_directory(&zip_archive, i))
		{
			mkDir(filePath);
		}
		else
		{
			p = mz_zip_reader_extract_file_to_heap(&zip_archive, file_stat.m_filename, &uncomp_size, 0);
			if (!p)
			{
				printf("mz_zip_reader_extract_file_to_heap() failed! - %s\n", file_stat.m_filename);
				mz_zip_reader_end(&zip_archive);
				system("pause"); return EXIT_FAILURE;
			}

			if (touchFile(filePath, p, uncomp_size))
			{
				size_t pos = filePath.rfind("\\");
				string noDirPath = filePath.substr(0, pos);
				mkDir(noDirPath);
				if (touchFile(filePath, p, uncomp_size))
				{
					printf("fopen_s() failed! - %s\n", file_stat.m_filename);
					system("pause"); return EXIT_FAILURE;
				}
			}

			mz_free(p);
		}

		printf("Filename: \"%s\", Comment: \"%s\", Uncompressed size: %u, Compressed size: %u, Is Dir: %u\n", file_stat.m_filename, file_stat.m_comment, (uint)file_stat.m_uncomp_size, (uint)file_stat.m_comp_size, mz_zip_reader_is_file_a_directory(&zip_archive, i));
	}

	mz_zip_reader_end(&zip_archive);

	printf("Success.\n");

	return EXIT_SUCCESS;
}

int copyFolder()
{
	SHFILEOPSTRUCT fop;
	ZeroMemory(&fop, sizeof fop);
	fop.wFunc = FO_COPY;
	fop.fFlags = FOF_SILENT | FOF_NOCONFIRMATION | FOF_NOERRORUI | FOF_NOCONFIRMMKDIR;
	fop.pFrom = copySourcePath;
	fop.pTo = copyTargetPath;

	return SHFileOperation(&fop);
}

int waitPidQuit(DWORD pid)
{
	long _start = clock();

	while (1)
	{
		if (GetProcessVersion(pid) != 0)
		{
			break;
		}

		if ((clock() - _start) / CLOCKS_PER_SEC >= 60)
		{
			return EXIT_FAILURE;
		}

		Sleep(100);
	}

	return EXIT_SUCCESS;
}

int main(int argc, char **argv)
{
	string restartCmd = "start " + string(argv[1]) + ".exe";
	DWORD pid = atoi(argv[2]);

	if (waitPidQuit(pid) == EXIT_FAILURE)
	{
		MessageBox(NULL, L"无法结束源程序运行, 升级失败, 请重试!", L"升级失败", MB_OK | MB_ICONERROR);
		return EXIT_FAILURE;
	}

	if (unzipUpdateFile() == EXIT_SUCCESS)
	{
		if (copyFolder() == EXIT_SUCCESS)
		{
			system(restartCmd.c_str());
		}
		else
		{
			MessageBox(NULL, L"检测到源程序还在运行, 请关闭所有正在运行的源程序后重试!", L"升级失败", MB_OK | MB_ICONERROR);
			return EXIT_FAILURE;
		}
	}
	else
	{
		MessageBox(NULL, L"升级包不完整, 升级失败, 请重试!", L"升级失败", MB_OK | MB_ICONERROR);
		return EXIT_FAILURE;
	}

#ifdef __DEBUG__
	system("pause");
#else
	rmDir(unzipPath);
	delFile(zipPath);
#endif


	return EXIT_SUCCESS;
}
