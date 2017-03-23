
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const async = require('async');
const util = require('../util');
const pkgInfo = require('../../app/package.json');
const vdprojConf = require('./vdprojConfig.json');

var vdprojTmpl = function (sourceDir, msiName, vdprojPath)
{
    var self = this;
    
    self.getNewGuid = function (splitFlag)
    {
      var guidRes = childProcess.execSync(`powershell New-Guid`);
      var guidStr = guidRes.toString().split(`\r\n`)[3];
      if (!splitFlag)
      {
        guidStr = `_` + guidStr.replace(new RegExp(`-`, `g`), ``)
      }

      return guidStr.toUpperCase();
    };

    self.bannerGuid = self.getNewGuid();
    self.targetDirGuid = self.getNewGuid();
    self.desktopFolderGuid = self.getNewGuid();
    self.programMenuFolderGuid = self.getNewGuid();

    self.mainAppGuid = ``;
    self.vdprojPath = vdprojPath;
    self.vdprojDir = path.join(self.vdprojPath, `..`);

    self.allFileObj = {guid: self.targetDirGuid, file:{}};
    
    self.hierarchyStr = "";
    self.fileStr = "";
    self.folderObj = {dir:{Folders:[]}};
    self.folderStr = "";

    self.readSourceDir = function (dirPath, fileObj, folderObj)
    {
        var fileArr = fs.readdirSync(dirPath);

        for (var i = 0, iLen = fileArr.length; i < iLen; ++i)
        {
            var filePath = `${dirPath}/${fileArr[i]}`;
            var fileRelativePath = filePath.slice(sourceDir.length + 1);

            var guid = self.getNewGuid();
            if (fs.statSync(filePath).isDirectory())
            {
                fileObj.file[fileRelativePath] = {
                    guid: guid,
                    file: {}
                };

                var subKey = `{9EF0B969-E518-4E46-987F-47570745A589}:${guid}`;
                var subFolderObj = {};
                subFolderObj[subKey] = {
                    "Name": `8:${path.basename(fileRelativePath)}`,
                    "AlwaysCreate": "11:FALSE",
                    "Condition": "8:",
                    "Transitive": "11:FALSE",
                    "Property": `8:${self.getNewGuid()}`,
                    "Folders": []
                };

                var mainKey = ``;
                for (var key in folderObj)
                {
                    mainKey = key;
                }
                folderObj[mainKey].Folders.push(subFolderObj);

                self.readSourceDir(filePath, fileObj.file[fileRelativePath], subFolderObj);
            }
            else
            {
                if (path.basename(fileRelativePath, `.exe`) == pkgInfo.name)
                {
                    self.mainAppGuid = guid;
                }

                fileObj.file[fileRelativePath] = {
                    guid: guid,
                    dir: fileObj.guid
                };

                self.hierarchyStr += `
                "Entry"
                {
                "MsmKey" = "8:${guid}"
                "OwnerKey" = "8:_UNDEFINED"
                "MsmSig" = "8:_UNDEFINED"
                }`;
                self.fileStr += `
                "{1FB2D0AE-D3B9-43D4-B9DD-F88EC61E35DE}:${guid}"
                {
                "SourcePath" = "8:${path.join(`..\\..\\..\\`, filePath).replace(new RegExp(`\\\\`, `g`), `\\\\`)}"
                "TargetName" = "8:${path.basename(fileRelativePath)}"
                "Tag" = "8:"
                "Folder" = "8:${fileObj.guid}"
                "Condition" = "8:"
                "Transitive" = "11:FALSE"
                "Vital" = "11:TRUE"
                "ReadOnly" = "11:FALSE"
                "Hidden" = "11:FALSE"
                "System" = "11:FALSE"
                "Permanent" = "11:FALSE"
                "SharedLegacy" = "11:FALSE"
                "PackageAs" = "3:1"
                "Register" = "3:1"
                "Exclude" = "11:FALSE"
                "IsDependency" = "11:FALSE"
                "IsolateTo" = "8:"
                }`;
            }
        }
    };

    self.addBanner = function ()
    {
        self.hierarchyStr += `
        "Entry"
        {
        "MsmKey" = "8:${self.bannerGuid}"
        "OwnerKey" = "8:_UNDEFINED"
        "MsmSig" = "8:_UNDEFINED"
        }`;
        self.fileStr += `
        "{1FB2D0AE-D3B9-43D4-B9DD-F88EC61E35DE}:${self.bannerGuid}"
        {
        "SourcePath" = "8:..\\\\banner.jpg"
        "TargetName" = "8:banner.jpg"
        "Tag" = "8:"
        "Folder" = "8:${self.targetDirGuid}"
        "Condition" = "8:"
        "Transitive" = "11:FALSE"
        "Vital" = "11:TRUE"
        "ReadOnly" = "11:FALSE"
        "Hidden" = "11:FALSE"
        "System" = "11:FALSE"
        "Permanent" = "11:FALSE"
        "SharedLegacy" = "11:FALSE"
        "PackageAs" = "3:1"
        "Register" = "3:1"
        "Exclude" = "11:TRUE"
        "IsDependency" = "11:FALSE"
        "IsolateTo" = "8:"
        }`;
    };

    self.formatFolderStr = function ()
    {
        self.folderStr = JSON.stringify(self.folderObj.dir.Folders);
        self.folderStr = self.folderStr.replace(new RegExp(`":{`, `g`), `"\n{\n`);
        self.folderStr = self.folderStr.replace(new RegExp(`":"`, `g`), `" = "`);
        self.folderStr = self.folderStr.replace(new RegExp(`^\\\[`, `g`), ``);
        self.folderStr = self.folderStr.replace(new RegExp(`":\\\[`, `g`), `"\n{`);
        self.folderStr = self.folderStr.replace(new RegExp(`]`, `g`), `}`);
        self.folderStr = self.folderStr.replace(new RegExp(`}}`, `g`), `}\n}`);
        self.folderStr = self.folderStr.replace(new RegExp(`","`, `g`), `"\n"`);
        self.folderStr = self.folderStr.replace(new RegExp(`},{`, `g`), `}\n{`);
        self.folderStr = self.folderStr.replace(new RegExp(`{}`, `g`), `{\n}`);
        self.folderStr = self.folderStr.replace(new RegExp(`}}`, `g`), `}\n}`);
        self.folderStr = self.folderStr.slice(0, self.folderStr.length - 1);

        var bracesStack = 0;
        for (var i = 0, iLen = self.folderStr.length; i < iLen; ++i)
        {
            if (self.folderStr.slice(i, i+3) == `{"{`)
            {
                self.folderStr = self.folderStr.substr(0, i) + "\n" + self.folderStr.slice(i+1);
                bracesStack = 0;
                for (var j = i, jLen = self.folderStr.length; j < jLen; ++j)
                {
                    if (self.folderStr[j] == `{`) bracesStack++;
                    if (self.folderStr[j] == `}`) bracesStack--;
                    if (bracesStack == -1)
                    {
                        self.folderStr = self.folderStr.substr(0, j) + self.folderStr.slice(j+1);
                        break;
                    }
                }
            }
        }
        
        self.folderStr = self.folderStr.replace(new RegExp(`\n+`, `g`), `\n`);
    };

    self.createDeployProject = function ()
    {
        self.readSourceDir(sourceDir, self.allFileObj, self.folderObj);
        self.formatFolderStr();

        self.addBanner();

        var outputFilenameStr = path.join(`..\\..\\..\\`, sourceDir, `..\\`, msiName).replace(new RegExp(`\\\\`, `g`), `\\\\`);
        var deployProjectStr = `"DeployProject"
            {
            "VSVersion" = "3:800"
            "ProjectType" = "8:{978C614F-708E-4E1A-B201-565925725DBA}"
            "IsWebType" = "8:FALSE"
            "ProjectName" = "8:${pkgInfo.name}"
            "LanguageId" = "3:2052"
            "CodePage" = "3:936"
            "UILanguageId" = "3:2052"
            "SccProjectName" = "8:"
            "SccLocalPath" = "8:"
            "SccAuxPath" = "8:"
            "SccProvider" = "8:"
                "Hierarchy"
                {
                    ${self.hierarchyStr}
                }
                "Configurations"
                {
                    "Debug"
                    {
                    "DisplayName" = "8:Debug"
                    "IsDebugOnly" = "11:TRUE"
                    "IsReleaseOnly" = "11:FALSE"
                    "OutputFilename" = "8:${outputFilenameStr}"
                    "PackageFilesAs" = "3:2"
                    "PackageFileSize" = "3:-2147483648"
                    "CabType" = "3:1"
                    "Compression" = "3:3"
                    "SignOutput" = "11:FALSE"
                    "CertificateFile" = "8:"
                    "PrivateKeyFile" = "8:"
                    "TimeStampServer" = "8:"
                    "InstallerBootstrapper" = "3:2"
                        "BootstrapperCfg:{63ACBE69-63AA-4F98-B2B6-99F9E24495F2}"
                        {
                        "Enabled" = "11:TRUE"
                        "PromptEnabled" = "11:TRUE"
                        "PrerequisitesLocation" = "2:1"
                        "Url" = "8:"
                        "ComponentsUrl" = "8:"
                            "Items"
                            {
                                "{EDC2488A-8267-493A-A98E-7D9C3B36CDF3}:.NETFramework,Version=v4.5"
                                {
                                "Name" = "8:Microsoft .NET Framework 4.5 (x86 and x64)"
                                "ProductCode" = "8:.NETFramework,Version=v4.5"
                                }
                            }
                        }
                    }
                    "Release"
                    {
                    "DisplayName" = "8:Release"
                    "IsDebugOnly" = "11:FALSE"
                    "IsReleaseOnly" = "11:TRUE"
                    "OutputFilename" = "8:${outputFilenameStr}"
                    "PackageFilesAs" = "3:2"
                    "PackageFileSize" = "3:-2147483648"
                    "CabType" = "3:1"
                    "Compression" = "3:3"
                    "SignOutput" = "11:FALSE"
                    "CertificateFile" = "8:"
                    "PrivateKeyFile" = "8:"
                    "TimeStampServer" = "8:"
                    "InstallerBootstrapper" = "3:2"
                        "BootstrapperCfg:{63ACBE69-63AA-4F98-B2B6-99F9E24495F2}"
                        {
                        "Enabled" = "11:TRUE"
                        "PromptEnabled" = "11:TRUE"
                        "PrerequisitesLocation" = "2:1"
                        "Url" = "8:"
                        "ComponentsUrl" = "8:"
                            "Items"
                            {
                                "{EDC2488A-8267-493A-A98E-7D9C3B36CDF3}:.NETFramework,Version=v4.5"
                                {
                                "Name" = "8:Microsoft .NET Framework 4.5 (x86 and x64)"
                                "ProductCode" = "8:.NETFramework,Version=v4.5"
                                }
                            }
                        }
                    }
                }
                "Deployable"
                {
                    "CustomAction"
                    {
                    }
                    "DefaultFeature"
                    {
                    "Name" = "8:DefaultFeature"
                    "Title" = "8:"
                    "Description" = "8:"
                    }
                    "ExternalPersistence"
                    {
                        "LaunchCondition"
                        {
                        }
                    }
                    "File"
                    {
                        ${self.fileStr}
                    }
                    "FileType"
                    {
                    }
                    "Folder"
                    {
                        "{3C67513D-01DD-4637-8A68-80971EB9504F}:${self.targetDirGuid}"
                        {
                        "DefaultLocation" = "8:[ProgramFiles64Folder][Manufacturer]\\\\[ProductName]"
                        "Name" = "8:#1925"
                        "AlwaysCreate" = "11:FALSE"
                        "Condition" = "8:"
                        "Transitive" = "11:FALSE"
                        "Property" = "8:TARGETDIR"
                            "Folders"
                            {
                                ${self.folderStr}
                            }
                        }
                        "{1525181F-901A-416C-8A58-119130FE478E}:${self.desktopFolderGuid}"
                        {
                        "Name" = "8:#1916"
                        "AlwaysCreate" = "11:FALSE"
                        "Condition" = "8:"
                        "Transitive" = "11:FALSE"
                        "Property" = "8:DesktopFolder"
                            "Folders"
                            {
                            }
                        }
                        "{1525181F-901A-416C-8A58-119130FE478E}:${self.programMenuFolderGuid}"
                        {
                        "Name" = "8:#1919"
                        "AlwaysCreate" = "11:FALSE"
                        "Condition" = "8:"
                        "Transitive" = "11:FALSE"
                        "Property" = "8:ProgramMenuFolder"
                            "Folders"
                            {
                            }
                        }
                    }
                    "LaunchCondition"
                    {
                    }
                    "Locator"
                    {
                    }
                    "MsiBootstrapper"
                    {
                    "LangId" = "3:2052"
                    "RequiresElevation" = "11:FALSE"
                    }
                    "Product"
                    {
                    "Name" = "8:Microsoft Visual Studio"
                    "ProductName" = "8:${pkgInfo.name}"
                    "ProductCode" = "8:{${vdprojConf.productCodeGuid}}"
                    "PackageCode" = "8:{${vdprojConf.packageCodeGuid}}"
                    "UpgradeCode" = "8:{${vdprojConf.upgradeCodeGuid}}"
                    "AspNetVersion" = "8:4.0.30319.0"
                    "RestartWWWService" = "11:FALSE"
                    "RemovePreviousVersions" = "11:FALSE"
                    "DetectNewerInstalledVersion" = "11:TRUE"
                    "InstallAllUsers" = "11:FALSE"
                    "ProductVersion" = "8:${pkgInfo.version}"
                    "Manufacturer" = "8:${vdprojConf.manufacturerStr}"
                    "ARPHELPTELEPHONE" = "8:"
                    "ARPHELPLINK" = "8:${vdprojConf.arpHelpLinkStr}"
                    "Title" = "8:${pkgInfo.name}"
                    "Subject" = "8:"
                    "ARPCONTACT" = "8:"
                    "Keywords" = "8:"
                    "ARPCOMMENTS" = "8:"
                    "ARPURLINFOABOUT" = "8:"
                    "ARPPRODUCTICON" = "8:${self.mainAppGuid}"
                    "ARPIconIndex" = "3:1"
                    "SearchPath" = "8:"
                    "UseSystemSearchPath" = "11:TRUE"
                    "TargetPlatform" = "3:1"
                    "PreBuildEvent" = "8:"
                    "PostBuildEvent" = "8:"
                    "RunPostBuildEvent" = "3:0"
                    }
                    "Registry"
                    {
                        "HKLM"
                        {
                            "Keys"
                            {
                            }
                        }
                        "HKCU"
                        {
                            "Keys"
                            {
                            }
                        }
                        "HKCR"
                        {
                            "Keys"
                            {
                            }
                        }
                        "HKU"
                        {
                            "Keys"
                            {
                            }
                        }
                        "HKPU"
                        {
                            "Keys"
                            {
                            }
                        }
                    }
                    "Sequences"
                    {
                    }
                    "Shortcut"
                    {
                        "{970C0BB2-C7D0-45D7-ABFA-7EC378858BC0}:${self.getNewGuid()}"
                        {
                        "Name" = "8:${pkgInfo.name}"
                        "Arguments" = "8:"
                        "Description" = "8:"
                        "ShowCmd" = "3:1"
                        "IconIndex" = "3:1"
                        "Transitive" = "11:FALSE"
                        "Target" = "8:${self.mainAppGuid}"
                        "Folder" = "8:${self.desktopFolderGuid}"
                        "WorkingFolder" = "8:${self.targetDirGuid}"
                        "Icon" = "8:${self.mainAppGuid}"
                        "Feature" = "8:"
                        }
                        "{970C0BB2-C7D0-45D7-ABFA-7EC378858BC0}:${self.getNewGuid()}"
                        {
                        "Name" = "8:${pkgInfo.name}"
                        "Arguments" = "8:"
                        "Description" = "8:"
                        "ShowCmd" = "3:1"
                        "IconIndex" = "3:1"
                        "Transitive" = "11:FALSE"
                        "Target" = "8:${self.mainAppGuid}"
                        "Folder" = "8:${self.programMenuFolderGuid}"
                        "WorkingFolder" = "8:${self.targetDirGuid}"
                        "Icon" = "8:${self.mainAppGuid}"
                        "Feature" = "8:"
                        }
                    }
                    "UserInterface"
                    {
                        "{DF760B10-853B-4699-99F2-AFF7185B4A62}:${self.getNewGuid()}"
                        {
                        "Name" = "8:#1900"
                        "Sequence" = "3:1"
                        "Attributes" = "3:1"
                            "Dialogs"
                            {
                                "{688940B3-5CA9-4162-8DEE-2993FA9D8CBC}:${self.getNewGuid()}"
                                {
                                "Sequence" = "3:100"
                                "DisplayName" = "8:欢迎使用"
                                "UseDynamicProperties" = "11:TRUE"
                                "IsDependency" = "11:FALSE"
                                "SourcePath" = "8:<VsdDialogDir>\\\\VsdWelcomeDlg.wid"
                                    "Properties"
                                    {
                                        "BannerBitmap"
                                        {
                                        "Name" = "8:BannerBitmap"
                                        "DisplayName" = "8:#1001"
                                        "Description" = "8:#1101"
                                        "Type" = "3:8"
                                        "ContextData" = "8:Bitmap"
                                        "Attributes" = "3:4"
                                        "Setting" = "3:2"
                                        "Value" = "8:${self.bannerGuid}"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                        "CopyrightWarning"
                                        {
                                        "Name" = "8:CopyrightWarning"
                                        "DisplayName" = "8:#1002"
                                        "Description" = "8:#1102"
                                        "Type" = "3:3"
                                        "ContextData" = "8:"
                                        "Attributes" = "3:0"
                                        "Setting" = "3:1"
                                        "Value" = "8:#1202"
                                        "DefaultValue" = "8:#1202"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                        "Welcome"
                                        {
                                        "Name" = "8:Welcome"
                                        "DisplayName" = "8:#1003"
                                        "Description" = "8:#1103"
                                        "Type" = "3:3"
                                        "ContextData" = "8:"
                                        "Attributes" = "3:0"
                                        "Setting" = "3:1"
                                        "Value" = "8:#1203"
                                        "DefaultValue" = "8:#1203"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                    }
                                }
                                "{688940B3-5CA9-4162-8DEE-2993FA9D8CBC}:${self.getNewGuid()}"
                                {
                                "Sequence" = "3:200"
                                "DisplayName" = "8:安装文件夹"
                                "UseDynamicProperties" = "11:TRUE"
                                "IsDependency" = "11:FALSE"
                                "SourcePath" = "8:<VsdDialogDir>\\\\VsdFolderDlg.wid"
                                    "Properties"
                                    {
                                        "BannerBitmap"
                                        {
                                        "Name" = "8:BannerBitmap"
                                        "DisplayName" = "8:#1001"
                                        "Description" = "8:#1101"
                                        "Type" = "3:8"
                                        "ContextData" = "8:Bitmap"
                                        "Attributes" = "3:4"
                                        "Setting" = "3:2"
                                        "Value" = "8:${self.bannerGuid}"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                        "InstallAllUsersVisible"
                                        {
                                        "Name" = "8:InstallAllUsersVisible"
                                        "DisplayName" = "8:#1059"
                                        "Description" = "8:#1159"
                                        "Type" = "3:5"
                                        "ContextData" = "8:1;True=1;False=0"
                                        "Attributes" = "3:0"
                                        "Setting" = "3:0"
                                        "Value" = "3:1"
                                        "DefaultValue" = "3:1"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                    }
                                }
                                "{688940B3-5CA9-4162-8DEE-2993FA9D8CBC}:${self.getNewGuid()}"
                                {
                                "Sequence" = "3:300"
                                "DisplayName" = "8:确认安装"
                                "UseDynamicProperties" = "11:TRUE"
                                "IsDependency" = "11:FALSE"
                                "SourcePath" = "8:<VsdDialogDir>\\\\VsdConfirmDlg.wid"
                                    "Properties"
                                    {
                                        "BannerBitmap"
                                        {
                                        "Name" = "8:BannerBitmap"
                                        "DisplayName" = "8:#1001"
                                        "Description" = "8:#1101"
                                        "Type" = "3:8"
                                        "ContextData" = "8:Bitmap"
                                        "Attributes" = "3:4"
                                        "Setting" = "3:2"
                                        "Value" = "8:${self.bannerGuid}"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                    }
                                }
                            }
                        }
                        "{DF760B10-853B-4699-99F2-AFF7185B4A62}:${self.getNewGuid()}"
                        {
                        "Name" = "8:#1901"
                        "Sequence" = "3:1"
                        "Attributes" = "3:2"
                            "Dialogs"
                            {
                                "{688940B3-5CA9-4162-8DEE-2993FA9D8CBC}:${self.getNewGuid()}"
                                {
                                "Sequence" = "3:100"
                                "DisplayName" = "8:进度"
                                "UseDynamicProperties" = "11:TRUE"
                                "IsDependency" = "11:FALSE"
                                "SourcePath" = "8:<VsdDialogDir>\\\\VsdProgressDlg.wid"
                                    "Properties"
                                    {
                                        "BannerBitmap"
                                        {
                                        "Name" = "8:BannerBitmap"
                                        "DisplayName" = "8:#1001"
                                        "Description" = "8:#1101"
                                        "Type" = "3:8"
                                        "ContextData" = "8:Bitmap"
                                        "Attributes" = "3:4"
                                        "Setting" = "3:2"
                                        "Value" = "8:${self.bannerGuid}"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                        "ShowProgress"
                                        {
                                        "Name" = "8:ShowProgress"
                                        "DisplayName" = "8:#1009"
                                        "Description" = "8:#1109"
                                        "Type" = "3:5"
                                        "ContextData" = "8:1;True=1;False=0"
                                        "Attributes" = "3:0"
                                        "Setting" = "3:0"
                                        "Value" = "3:1"
                                        "DefaultValue" = "3:1"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                    }
                                }
                            }
                        }
                        "{DF760B10-853B-4699-99F2-AFF7185B4A62}:${self.getNewGuid()}"
                        {
                        "Name" = "8:#1902"
                        "Sequence" = "3:1"
                        "Attributes" = "3:3"
                            "Dialogs"
                            {
                                "{688940B3-5CA9-4162-8DEE-2993FA9D8CBC}:${self.getNewGuid()}"
                                {
                                "Sequence" = "3:100"
                                "DisplayName" = "8:已完成"
                                "UseDynamicProperties" = "11:TRUE"
                                "IsDependency" = "11:FALSE"
                                "SourcePath" = "8:<VsdDialogDir>\\\\VsdFinishedDlg.wid"
                                    "Properties"
                                    {
                                        "BannerBitmap"
                                        {
                                        "Name" = "8:BannerBitmap"
                                        "DisplayName" = "8:#1001"
                                        "Description" = "8:#1101"
                                        "Type" = "3:8"
                                        "ContextData" = "8:Bitmap"
                                        "Attributes" = "3:4"
                                        "Setting" = "3:2"
                                        "Value" = "8:${self.bannerGuid}"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                        "UpdateText"
                                        {
                                        "Name" = "8:UpdateText"
                                        "DisplayName" = "8:#1058"
                                        "Description" = "8:#1158"
                                        "Type" = "3:15"
                                        "ContextData" = "8:"
                                        "Attributes" = "3:0"
                                        "Setting" = "3:1"
                                        "Value" = "8:#1258"
                                        "DefaultValue" = "8:#1258"
                                        "UsePlugInResources" = "11:TRUE"
                                        }
                                    }
                                }
                            }
                        }
                        "{2479F3F5-0309-486D-8047-8187E2CE5BA0}:${self.getNewGuid()}"
                        {
                        "UseDynamicProperties" = "11:FALSE"
                        "IsDependency" = "11:FALSE"
                        "SourcePath" = "8:<VsdDialogDir>\\\\VsdUserInterface.wim"
                        }
                        "{2479F3F5-0309-486D-8047-8187E2CE5BA0}:${self.getNewGuid()}"
                        {
                        "UseDynamicProperties" = "11:FALSE"
                        "IsDependency" = "11:FALSE"
                        "SourcePath" = "8:<VsdDialogDir>\\\\VsdBasicDialogs.wim"
                        }
                    }
                    "MergeModule"
                    {
                    }
                    "ProjectOutput"
                    {
                    }
                }
            }`;

        deployProjectStr = deployProjectStr.replace(new RegExp(`\n {12}`, `g`), `\n`);
        
        var utf8Bom = new Buffer([0xEF, 0xBB, 0xBF]);
        var contentBuff = new Buffer(deployProjectStr);
        var fileBuff = Buffer.concat([utf8Bom, contentBuff]);

        var fd = fs.openSync(self.vdprojPath, "w");
        fs.writeSync(fd, fileBuff, 0, fileBuff.length, 0);
        fs.closeSync(fd);
    };

    self.createVdprojFile = function ()
    {
        if (!fs.existsSync(self.vdprojDir))
        {
            fs.mkdirSync(self.vdprojDir);
        }
        
        self.createDeployProject();
    };

    self.createVdprojFile();
};

module.exports = { vdprojTmpl };
