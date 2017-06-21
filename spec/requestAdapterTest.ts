import { IHTTPResponse, IRequestAdapter, IRequestOptions, Methods, RequestAdapter } from "../src/requestAdapter";

/* mock server successful response */
const respData = [{id: 1}, {id: 2}, {id: 3}];
/* mock server error response */
const errUnauthorized = {errors: ["Unauthorized."]};

export const mockFetch = (uri: string, opts: IRequestOptions): Promise<IHTTPResponse> => {
  if (uri === "validURL") {
    if (opts.headers) {
      /* success */
      return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(respData)} as IHTTPResponse);
    }
    /* unauthorized (returns "not ok" status) */
    return Promise.resolve({ok: false, status: 401, json: () => Promise.resolve(errUnauthorized)} as IHTTPResponse);
  }
  /* fetch error */
  return Promise.reject(new Error("Fetch error."));
};

/* Mock request adapter */
export const mockRequestAdapter: IRequestAdapter = {
  execute: (uri: string, opt: IRequestOptions): Promise<any> => {
    /* check URL validity */
    if (uri === "validUrl/auth") {
      switch (opt.method) {
        /* log in */
        case Methods.POST:
          if ((opt.body as any).email === "validKey" && (opt.body as any).password === "validSecret") {
            return Promise.resolve({token: "validToken", refresh_token: "validRefreshToken"});
          }
          return Promise.reject(new Error("Auth error."));
        /* refresh token */
        case Methods.PATCH:
          if ((opt.headers as any).Authorization === "validToken"
            && (opt.body as any).refresh_token === "validRefreshToken") {
            return Promise.resolve({token: "updatedToken", refresh_token: "updatedRefreshToken"});
          }
          return Promise.reject(new Error("Auth error."));
        /* do not allow to use other methods */
        default:
          /* not implemented */
          return Promise.reject(new Error("Not implemented."));
      }
    }
    /* not found error */
    return Promise.reject(new Error("Not found."));
  },
};

describe("Class: RequestAdapter", () => {
  describe("when creating the RequestAdapter", () => {
    it("should create a valid object", () => {
      expect(new RequestAdapter(mockFetch)).toBeDefined();
    });
  });

  describe("when executing a succesful query", () => {
    it("should not throw an exception and should return the data", (done) => {
      (new RequestAdapter(mockFetch))
        .execute("validURL", {headers: {}})
        .then((data: any) => {
          expect(data).toEqual(respData);
          done();
        })
        .catch((err: Error) => {
          done.fail(err);
        });
    });

    describe("when calling fetch fails", () => {
      it("should cause fetch error", (done) => {
        (new RequestAdapter(mockFetch))
          .execute("invalidURL", {})
          .then((data: any) => {
            done.fail("should throw an error");
          })
          .catch((err: Error) => {
            expect(err).toEqual(new Error("Fetch error."));
            done();
          });
      });
    });

    describe("when executing query with not ok status", () => {
      it("should throw an exception", (done) => {
        (new RequestAdapter(mockFetch))
          .execute("validURL", {})
          .then((data: any) => {
            done.fail("should throw an error");
          })
          .catch((err: Error) => {
            expect(err).toEqual(new Error("Unauthorized."));
            done();
          });
      });
    });
  });
});
