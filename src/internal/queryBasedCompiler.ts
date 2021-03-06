import { DataRequest } from "../api/dataops/dataRequest";
import { ICondition } from "../api/dataops/filteringCondition";
import { Query } from "./query";

export interface ICompiledRequest {
    action: string;
    records?: Array<object>;
    params?: ICompiledQuery;
}

export interface ICompiledQuery {
  data?: object;
  conditions?: Array<object>;
  fields?: string[];
  orders?: Array<object>;
  range?: object;
}

export function compileDataRequest(dataRequest: DataRequest): ICompiledRequest {
  if (!dataRequest.Action) {
    throw new Error("You need to set an Action before compiling the Request.");
  }

  let compiledQuery: ICompiledRequest = {action: dataRequest.Action};
  let compiledQueryOptions = new QueryBasedCompiler(dataRequest.Query).compile();

  if (compiledQueryOptions && Object.keys(compiledQueryOptions).length !== 0 ) {
    compiledQuery.params = compiledQueryOptions;
  }

  if (dataRequest.Records) {
    compiledQuery.records = dataRequest.Records;
  }

  return compiledQuery;
}

export class QueryBasedCompiler {
    private queryObject: Query;

    public constructor(queryObject: Query) {
        this.queryObject = queryObject;
    }

    public compile(): ICompiledQuery {
        return this.compileQueryOptions(this.queryObject);
    }

    private compileLimitOffset(queryOptions: any, query: Query): object {
        let range: any = {};
        if (query.Limit) {
            range.limit = query.Limit;
        }
        if (query.Offset) {
            range.offset = query.Offset;
        }
        return range;
    }

    private compileFilteringConditions(condition: ICondition): object {
      return [condition.compile()];
    }

    private compileQueryOptions(query: Query): ICompiledQuery {
      let compiledQueryOptions: any = {};
      if (query.Filter) {
        compiledQueryOptions.conditions = this.compileFilteringConditions(query.Filter);
      }

      let range = this.compileLimitOffset(compiledQueryOptions, this.queryObject);
      if (Object.keys(range).length > 0) {
        compiledQueryOptions.range = range;
      }

      if (query.Fields) {
        compiledQueryOptions.fields = query.Fields;
      }

      if (query.SortOrders && query.SortOrders.length > 0) {
        compiledQueryOptions.orders = query.SortOrders;
      }

      if (query.Data) {
        compiledQueryOptions.data = query.Data;
      }

      if (query.Relations && query.Relations.length > 0) {
        compiledQueryOptions.relations = {};
        for (let relation of query.Relations) {
          compiledQueryOptions.relations[relation.Dataset] = new QueryBasedCompiler(relation).compile();
        }
      }

      return compiledQueryOptions;
    }
}
