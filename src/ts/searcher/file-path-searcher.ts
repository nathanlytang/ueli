import * as fs from "fs";
import * as path from "path";
import { FileHelpers } from "../helpers/file-helpers";
import { Injector } from "../injector";
import { SearchEngine } from "../search-engine";
import { SearchResultItem } from "../search-result-item";
import { Searcher } from "./searcher";
import { platform } from "os";
import { ConfigOptions } from "../config-options";

export class FilePathSearcher implements Searcher {
    private iconSet = Injector.getIconSet(platform());
    private config: ConfigOptions;

    constructor(config: ConfigOptions) {
        this.config = config;
    }

    public getSearchResult(userInput: string): SearchResultItem[] {
        let filePath;

        if (fs.existsSync(userInput)) {
            filePath = userInput;
            const stats = fs.lstatSync(filePath);
            if (stats.isDirectory()) {
                return this.getFolderSearchResult(filePath);
            } else {
                return this.getFileSearchResult(filePath);
            }
        } else if (fs.existsSync(path.dirname(userInput))) {
            filePath = path.dirname(userInput);
            const searchTerm = path.basename(userInput);
            return this.getFolderSearchResult(filePath, searchTerm);
        }

        return [];
    }

    private getFolderSearchResult(folderPath: string, searchTerm?: string): SearchResultItem[] {
        const result = [] as SearchResultItem[];

        const files = FileHelpers.getFilesFromFolder(folderPath);

        for (const file of files) {
            result.push({
                executionArgument: file,
                icon: fs.lstatSync(file).isDirectory()
                    ? this.iconSet.folderIcon
                    : this.iconSet.fileIcon,
                name: path.basename(file),
                tags: [],
            } as SearchResultItem);
        }

        return searchTerm === undefined
            ? result
            : this.sortSearchResult(result, searchTerm);
    }

    private sortSearchResult(searchResultItems: SearchResultItem[], searchTerm: string): SearchResultItem[] {
        const searchEngine = new SearchEngine(searchResultItems, this.config.searchEngineThreshold);
        return searchEngine.search(searchTerm);
    }

    private getFileSearchResult(filePath: string): SearchResultItem[] {
        return [
            {
                executionArgument: filePath,
                icon: this.iconSet.fileIcon,
                name: path.basename(filePath),
                tags: [],
            } as SearchResultItem,
        ];
    }
}
