enum AppSectors {
  AUTH = "[AUTH]",
  CHAT = "[CHAT]",
  SYSTEM = "[SYSTEM]",
  WEBSOCKET = "[WEBSOCKET]",
  OTHER = "[OTHER]",
}

enum SectorCss {
  AUTH = "",
  CHAT = "",
  SYSTEM = "",
  WEBSOCKET = "background-color: #7907f3; color: #ffffff;",
  OTHER = "",
}

type AppSectorsType = keyof typeof AppSectors;

export function logMessage(
  sector: AppSectors | AppSectorsType,
  message: string,
  ...optionalParams: unknown[]
) {
  const _sector = (typeof sector === "string" ? AppSectors[sector as AppSectorsType] : sector) as AppSectors || AppSectors.OTHER;
  const sectorKey = Object.keys(AppSectors).find(key => AppSectors[key as AppSectorsType] === _sector) as AppSectorsType || "OTHER";
  const sectorColor = SectorCss[sectorKey];

  const timestamp = new Date().toISOString();
  console.log(`%c${_sector} ${timestamp}%c ${message}`, sectorColor, "background-color: inherit; color: inherit;", ...optionalParams);
}
