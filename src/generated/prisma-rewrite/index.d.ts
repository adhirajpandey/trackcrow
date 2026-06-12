
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Category
 * 
 */
export type Category = $Result.DefaultSelection<Prisma.$CategoryPayload>
/**
 * Model Subcategory
 * 
 */
export type Subcategory = $Result.DefaultSelection<Prisma.$SubcategoryPayload>
/**
 * Model Recipient
 * 
 */
export type Recipient = $Result.DefaultSelection<Prisma.$RecipientPayload>
/**
 * Model RecipientIdentifier
 * 
 */
export type RecipientIdentifier = $Result.DefaultSelection<Prisma.$RecipientIdentifierPayload>
/**
 * Model Transaction
 * 
 */
export type Transaction = $Result.DefaultSelection<Prisma.$TransactionPayload>
/**
 * Model RawMessage
 * 
 */
export type RawMessage = $Result.DefaultSelection<Prisma.$RawMessagePayload>
/**
 * Model DeviceToken
 * 
 */
export type DeviceToken = $Result.DefaultSelection<Prisma.$DeviceTokenPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const TransactionType: {
  UPI: 'UPI',
  CARD: 'CARD',
  CASH: 'CASH',
  NETBANKING: 'NETBANKING',
  OTHER: 'OTHER'
};

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]


export const TransactionSource: {
  SMS: 'SMS',
  MANUAL: 'MANUAL'
};

export type TransactionSource = (typeof TransactionSource)[keyof typeof TransactionSource]


export const RawMessageSource: {
  SMS: 'SMS'
};

export type RawMessageSource = (typeof RawMessageSource)[keyof typeof RawMessageSource]


export const ParseStatus: {
  PARSED: 'PARSED',
  UNPARSEABLE: 'UNPARSEABLE',
  FAILED: 'FAILED'
};

export type ParseStatus = (typeof ParseStatus)[keyof typeof ParseStatus]


export const RecipientIdentifierKind: {
  UPI_ID: 'UPI_ID',
  PHONE: 'PHONE',
  CARD_MERCHANT: 'CARD_MERCHANT',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  TEXT: 'TEXT'
};

export type RecipientIdentifierKind = (typeof RecipientIdentifierKind)[keyof typeof RecipientIdentifierKind]

}

export type TransactionType = $Enums.TransactionType

export const TransactionType: typeof $Enums.TransactionType

export type TransactionSource = $Enums.TransactionSource

export const TransactionSource: typeof $Enums.TransactionSource

export type RawMessageSource = $Enums.RawMessageSource

export const RawMessageSource: typeof $Enums.RawMessageSource

export type ParseStatus = $Enums.ParseStatus

export const ParseStatus: typeof $Enums.ParseStatus

export type RecipientIdentifierKind = $Enums.RecipientIdentifierKind

export const RecipientIdentifierKind: typeof $Enums.RecipientIdentifierKind

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.category`: Exposes CRUD operations for the **Category** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Categories
    * const categories = await prisma.category.findMany()
    * ```
    */
  get category(): Prisma.CategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.subcategory`: Exposes CRUD operations for the **Subcategory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Subcategories
    * const subcategories = await prisma.subcategory.findMany()
    * ```
    */
  get subcategory(): Prisma.SubcategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.recipient`: Exposes CRUD operations for the **Recipient** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Recipients
    * const recipients = await prisma.recipient.findMany()
    * ```
    */
  get recipient(): Prisma.RecipientDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.recipientIdentifier`: Exposes CRUD operations for the **RecipientIdentifier** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RecipientIdentifiers
    * const recipientIdentifiers = await prisma.recipientIdentifier.findMany()
    * ```
    */
  get recipientIdentifier(): Prisma.RecipientIdentifierDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.transaction`: Exposes CRUD operations for the **Transaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Transactions
    * const transactions = await prisma.transaction.findMany()
    * ```
    */
  get transaction(): Prisma.TransactionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.rawMessage`: Exposes CRUD operations for the **RawMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RawMessages
    * const rawMessages = await prisma.rawMessage.findMany()
    * ```
    */
  get rawMessage(): Prisma.RawMessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.deviceToken`: Exposes CRUD operations for the **DeviceToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DeviceTokens
    * const deviceTokens = await prisma.deviceToken.findMany()
    * ```
    */
  get deviceToken(): Prisma.DeviceTokenDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.2
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Category: 'Category',
    Subcategory: 'Subcategory',
    Recipient: 'Recipient',
    RecipientIdentifier: 'RecipientIdentifier',
    Transaction: 'Transaction',
    RawMessage: 'RawMessage',
    DeviceToken: 'DeviceToken'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "category" | "subcategory" | "recipient" | "recipientIdentifier" | "transaction" | "rawMessage" | "deviceToken"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Category: {
        payload: Prisma.$CategoryPayload<ExtArgs>
        fields: Prisma.CategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findFirst: {
            args: Prisma.CategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findMany: {
            args: Prisma.CategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          create: {
            args: Prisma.CategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          createMany: {
            args: Prisma.CategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          delete: {
            args: Prisma.CategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          update: {
            args: Prisma.CategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          upsert: {
            args: Prisma.CategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          aggregate: {
            args: Prisma.CategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategory>
          }
          groupBy: {
            args: Prisma.CategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryCountAggregateOutputType> | number
          }
        }
      }
      Subcategory: {
        payload: Prisma.$SubcategoryPayload<ExtArgs>
        fields: Prisma.SubcategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubcategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubcategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          findFirst: {
            args: Prisma.SubcategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubcategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          findMany: {
            args: Prisma.SubcategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>[]
          }
          create: {
            args: Prisma.SubcategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          createMany: {
            args: Prisma.SubcategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubcategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>[]
          }
          delete: {
            args: Prisma.SubcategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          update: {
            args: Prisma.SubcategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          deleteMany: {
            args: Prisma.SubcategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubcategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SubcategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>[]
          }
          upsert: {
            args: Prisma.SubcategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          aggregate: {
            args: Prisma.SubcategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubcategory>
          }
          groupBy: {
            args: Prisma.SubcategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubcategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubcategoryCountArgs<ExtArgs>
            result: $Utils.Optional<SubcategoryCountAggregateOutputType> | number
          }
        }
      }
      Recipient: {
        payload: Prisma.$RecipientPayload<ExtArgs>
        fields: Prisma.RecipientFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RecipientFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RecipientFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>
          }
          findFirst: {
            args: Prisma.RecipientFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RecipientFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>
          }
          findMany: {
            args: Prisma.RecipientFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>[]
          }
          create: {
            args: Prisma.RecipientCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>
          }
          createMany: {
            args: Prisma.RecipientCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RecipientCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>[]
          }
          delete: {
            args: Prisma.RecipientDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>
          }
          update: {
            args: Prisma.RecipientUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>
          }
          deleteMany: {
            args: Prisma.RecipientDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RecipientUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RecipientUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>[]
          }
          upsert: {
            args: Prisma.RecipientUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientPayload>
          }
          aggregate: {
            args: Prisma.RecipientAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRecipient>
          }
          groupBy: {
            args: Prisma.RecipientGroupByArgs<ExtArgs>
            result: $Utils.Optional<RecipientGroupByOutputType>[]
          }
          count: {
            args: Prisma.RecipientCountArgs<ExtArgs>
            result: $Utils.Optional<RecipientCountAggregateOutputType> | number
          }
        }
      }
      RecipientIdentifier: {
        payload: Prisma.$RecipientIdentifierPayload<ExtArgs>
        fields: Prisma.RecipientIdentifierFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RecipientIdentifierFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RecipientIdentifierFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>
          }
          findFirst: {
            args: Prisma.RecipientIdentifierFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RecipientIdentifierFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>
          }
          findMany: {
            args: Prisma.RecipientIdentifierFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>[]
          }
          create: {
            args: Prisma.RecipientIdentifierCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>
          }
          createMany: {
            args: Prisma.RecipientIdentifierCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RecipientIdentifierCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>[]
          }
          delete: {
            args: Prisma.RecipientIdentifierDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>
          }
          update: {
            args: Prisma.RecipientIdentifierUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>
          }
          deleteMany: {
            args: Prisma.RecipientIdentifierDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RecipientIdentifierUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RecipientIdentifierUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>[]
          }
          upsert: {
            args: Prisma.RecipientIdentifierUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecipientIdentifierPayload>
          }
          aggregate: {
            args: Prisma.RecipientIdentifierAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRecipientIdentifier>
          }
          groupBy: {
            args: Prisma.RecipientIdentifierGroupByArgs<ExtArgs>
            result: $Utils.Optional<RecipientIdentifierGroupByOutputType>[]
          }
          count: {
            args: Prisma.RecipientIdentifierCountArgs<ExtArgs>
            result: $Utils.Optional<RecipientIdentifierCountAggregateOutputType> | number
          }
        }
      }
      Transaction: {
        payload: Prisma.$TransactionPayload<ExtArgs>
        fields: Prisma.TransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findFirst: {
            args: Prisma.TransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findMany: {
            args: Prisma.TransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          create: {
            args: Prisma.TransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          createMany: {
            args: Prisma.TransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          delete: {
            args: Prisma.TransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          update: {
            args: Prisma.TransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          deleteMany: {
            args: Prisma.TransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TransactionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          upsert: {
            args: Prisma.TransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          aggregate: {
            args: Prisma.TransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTransaction>
          }
          groupBy: {
            args: Prisma.TransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<TransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.TransactionCountArgs<ExtArgs>
            result: $Utils.Optional<TransactionCountAggregateOutputType> | number
          }
        }
      }
      RawMessage: {
        payload: Prisma.$RawMessagePayload<ExtArgs>
        fields: Prisma.RawMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RawMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RawMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>
          }
          findFirst: {
            args: Prisma.RawMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RawMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>
          }
          findMany: {
            args: Prisma.RawMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>[]
          }
          create: {
            args: Prisma.RawMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>
          }
          createMany: {
            args: Prisma.RawMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RawMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>[]
          }
          delete: {
            args: Prisma.RawMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>
          }
          update: {
            args: Prisma.RawMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>
          }
          deleteMany: {
            args: Prisma.RawMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RawMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RawMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>[]
          }
          upsert: {
            args: Prisma.RawMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RawMessagePayload>
          }
          aggregate: {
            args: Prisma.RawMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRawMessage>
          }
          groupBy: {
            args: Prisma.RawMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<RawMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.RawMessageCountArgs<ExtArgs>
            result: $Utils.Optional<RawMessageCountAggregateOutputType> | number
          }
        }
      }
      DeviceToken: {
        payload: Prisma.$DeviceTokenPayload<ExtArgs>
        fields: Prisma.DeviceTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DeviceTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DeviceTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>
          }
          findFirst: {
            args: Prisma.DeviceTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DeviceTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>
          }
          findMany: {
            args: Prisma.DeviceTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>[]
          }
          create: {
            args: Prisma.DeviceTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>
          }
          createMany: {
            args: Prisma.DeviceTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DeviceTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>[]
          }
          delete: {
            args: Prisma.DeviceTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>
          }
          update: {
            args: Prisma.DeviceTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>
          }
          deleteMany: {
            args: Prisma.DeviceTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DeviceTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DeviceTokenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>[]
          }
          upsert: {
            args: Prisma.DeviceTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeviceTokenPayload>
          }
          aggregate: {
            args: Prisma.DeviceTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDeviceToken>
          }
          groupBy: {
            args: Prisma.DeviceTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<DeviceTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.DeviceTokenCountArgs<ExtArgs>
            result: $Utils.Optional<DeviceTokenCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    category?: CategoryOmit
    subcategory?: SubcategoryOmit
    recipient?: RecipientOmit
    recipientIdentifier?: RecipientIdentifierOmit
    transaction?: TransactionOmit
    rawMessage?: RawMessageOmit
    deviceToken?: DeviceTokenOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    categories: number
    subcategories: number
    recipients: number
    transactions: number
    rawMessages: number
    deviceTokens: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categories?: boolean | UserCountOutputTypeCountCategoriesArgs
    subcategories?: boolean | UserCountOutputTypeCountSubcategoriesArgs
    recipients?: boolean | UserCountOutputTypeCountRecipientsArgs
    transactions?: boolean | UserCountOutputTypeCountTransactionsArgs
    rawMessages?: boolean | UserCountOutputTypeCountRawMessagesArgs
    deviceTokens?: boolean | UserCountOutputTypeCountDeviceTokensArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCategoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSubcategoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubcategoryWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRecipientsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecipientWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRawMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RawMessageWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountDeviceTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DeviceTokenWhereInput
  }


  /**
   * Count Type CategoryCountOutputType
   */

  export type CategoryCountOutputType = {
    subcategories: number
    transactions: number
  }

  export type CategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    subcategories?: boolean | CategoryCountOutputTypeCountSubcategoriesArgs
    transactions?: boolean | CategoryCountOutputTypeCountTransactionsArgs
  }

  // Custom InputTypes
  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryCountOutputType
     */
    select?: CategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountSubcategoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubcategoryWhereInput
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }


  /**
   * Count Type SubcategoryCountOutputType
   */

  export type SubcategoryCountOutputType = {
    transactions: number
  }

  export type SubcategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | SubcategoryCountOutputTypeCountTransactionsArgs
  }

  // Custom InputTypes
  /**
   * SubcategoryCountOutputType without action
   */
  export type SubcategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryCountOutputType
     */
    select?: SubcategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SubcategoryCountOutputType without action
   */
  export type SubcategoryCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }


  /**
   * Count Type RecipientCountOutputType
   */

  export type RecipientCountOutputType = {
    identifiers: number
    transactions: number
  }

  export type RecipientCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    identifiers?: boolean | RecipientCountOutputTypeCountIdentifiersArgs
    transactions?: boolean | RecipientCountOutputTypeCountTransactionsArgs
  }

  // Custom InputTypes
  /**
   * RecipientCountOutputType without action
   */
  export type RecipientCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientCountOutputType
     */
    select?: RecipientCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * RecipientCountOutputType without action
   */
  export type RecipientCountOutputTypeCountIdentifiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecipientIdentifierWhereInput
  }

  /**
   * RecipientCountOutputType without action
   */
  export type RecipientCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }


  /**
   * Count Type TransactionCountOutputType
   */

  export type TransactionCountOutputType = {
    rawMessages: number
  }

  export type TransactionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    rawMessages?: boolean | TransactionCountOutputTypeCountRawMessagesArgs
  }

  // Custom InputTypes
  /**
   * TransactionCountOutputType without action
   */
  export type TransactionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionCountOutputType
     */
    select?: TransactionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TransactionCountOutputType without action
   */
  export type TransactionCountOutputTypeCountRawMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RawMessageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
    subscription: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
    subscription: number | null
  }

  export type UserMinAggregateOutputType = {
    uuid: string | null
    id: number | null
    email: string | null
    name: string | null
    image: string | null
    provider: string | null
    subscription: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    uuid: string | null
    id: number | null
    email: string | null
    name: string | null
    image: string | null
    provider: string | null
    subscription: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    uuid: number
    id: number
    email: number
    name: number
    image: number
    provider: number
    subscription: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
    subscription?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
    subscription?: true
  }

  export type UserMinAggregateInputType = {
    uuid?: true
    id?: true
    email?: true
    name?: true
    image?: true
    provider?: true
    subscription?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    uuid?: true
    id?: true
    email?: true
    name?: true
    image?: true
    provider?: true
    subscription?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    uuid?: true
    id?: true
    email?: true
    name?: true
    image?: true
    provider?: true
    subscription?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    uuid: string
    id: number
    email: string
    name: string
    image: string | null
    provider: string
    subscription: number
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    uuid?: boolean
    id?: boolean
    email?: boolean
    name?: boolean
    image?: boolean
    provider?: boolean
    subscription?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    categories?: boolean | User$categoriesArgs<ExtArgs>
    subcategories?: boolean | User$subcategoriesArgs<ExtArgs>
    recipients?: boolean | User$recipientsArgs<ExtArgs>
    transactions?: boolean | User$transactionsArgs<ExtArgs>
    rawMessages?: boolean | User$rawMessagesArgs<ExtArgs>
    deviceTokens?: boolean | User$deviceTokensArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    uuid?: boolean
    id?: boolean
    email?: boolean
    name?: boolean
    image?: boolean
    provider?: boolean
    subscription?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    uuid?: boolean
    id?: boolean
    email?: boolean
    name?: boolean
    image?: boolean
    provider?: boolean
    subscription?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    uuid?: boolean
    id?: boolean
    email?: boolean
    name?: boolean
    image?: boolean
    provider?: boolean
    subscription?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"uuid" | "id" | "email" | "name" | "image" | "provider" | "subscription" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categories?: boolean | User$categoriesArgs<ExtArgs>
    subcategories?: boolean | User$subcategoriesArgs<ExtArgs>
    recipients?: boolean | User$recipientsArgs<ExtArgs>
    transactions?: boolean | User$transactionsArgs<ExtArgs>
    rawMessages?: boolean | User$rawMessagesArgs<ExtArgs>
    deviceTokens?: boolean | User$deviceTokensArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      categories: Prisma.$CategoryPayload<ExtArgs>[]
      subcategories: Prisma.$SubcategoryPayload<ExtArgs>[]
      recipients: Prisma.$RecipientPayload<ExtArgs>[]
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
      rawMessages: Prisma.$RawMessagePayload<ExtArgs>[]
      deviceTokens: Prisma.$DeviceTokenPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      uuid: string
      id: number
      email: string
      name: string
      image: string | null
      provider: string
      subscription: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `uuid`
     * const userWithUuidOnly = await prisma.user.findMany({ select: { uuid: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `uuid`
     * const userWithUuidOnly = await prisma.user.createManyAndReturn({
     *   select: { uuid: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `uuid`
     * const userWithUuidOnly = await prisma.user.updateManyAndReturn({
     *   select: { uuid: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    categories<T extends User$categoriesArgs<ExtArgs> = {}>(args?: Subset<T, User$categoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    subcategories<T extends User$subcategoriesArgs<ExtArgs> = {}>(args?: Subset<T, User$subcategoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    recipients<T extends User$recipientsArgs<ExtArgs> = {}>(args?: Subset<T, User$recipientsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    transactions<T extends User$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, User$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    rawMessages<T extends User$rawMessagesArgs<ExtArgs> = {}>(args?: Subset<T, User$rawMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    deviceTokens<T extends User$deviceTokensArgs<ExtArgs> = {}>(args?: Subset<T, User$deviceTokensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly uuid: FieldRef<"User", 'String'>
    readonly id: FieldRef<"User", 'Int'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly image: FieldRef<"User", 'String'>
    readonly provider: FieldRef<"User", 'String'>
    readonly subscription: FieldRef<"User", 'Int'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.categories
   */
  export type User$categoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    cursor?: CategoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * User.subcategories
   */
  export type User$subcategoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    where?: SubcategoryWhereInput
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    cursor?: SubcategoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * User.recipients
   */
  export type User$recipientsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    where?: RecipientWhereInput
    orderBy?: RecipientOrderByWithRelationInput | RecipientOrderByWithRelationInput[]
    cursor?: RecipientWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RecipientScalarFieldEnum | RecipientScalarFieldEnum[]
  }

  /**
   * User.transactions
   */
  export type User$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * User.rawMessages
   */
  export type User$rawMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    where?: RawMessageWhereInput
    orderBy?: RawMessageOrderByWithRelationInput | RawMessageOrderByWithRelationInput[]
    cursor?: RawMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RawMessageScalarFieldEnum | RawMessageScalarFieldEnum[]
  }

  /**
   * User.deviceTokens
   */
  export type User$deviceTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    where?: DeviceTokenWhereInput
    orderBy?: DeviceTokenOrderByWithRelationInput | DeviceTokenOrderByWithRelationInput[]
    cursor?: DeviceTokenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DeviceTokenScalarFieldEnum | DeviceTokenScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Category
   */

  export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null
    _avg: CategoryAvgAggregateOutputType | null
    _sum: CategorySumAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  export type CategoryAvgAggregateOutputType = {
    id: number | null
  }

  export type CategorySumAggregateOutputType = {
    id: number | null
  }

  export type CategoryMinAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryMaxAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryCountAggregateOutputType = {
    id: number
    uuid: number
    userUuid: number
    name: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CategoryAvgAggregateInputType = {
    id?: true
  }

  export type CategorySumAggregateInputType = {
    id?: true
  }

  export type CategoryMinAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryMaxAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryCountAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    name?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Category to aggregate.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Categories
    **/
    _count?: true | CategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CategoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CategorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryMaxAggregateInputType
  }

  export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategory[P]>
      : GetScalarType<T[P], AggregateCategory[P]>
  }




  export type CategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithAggregationInput | CategoryOrderByWithAggregationInput[]
    by: CategoryScalarFieldEnum[] | CategoryScalarFieldEnum
    having?: CategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryCountAggregateInputType | true
    _avg?: CategoryAvgAggregateInputType
    _sum?: CategorySumAggregateInputType
    _min?: CategoryMinAggregateInputType
    _max?: CategoryMaxAggregateInputType
  }

  export type CategoryGroupByOutputType = {
    id: number
    uuid: string
    userUuid: string
    name: string
    createdAt: Date
    updatedAt: Date
    _count: CategoryCountAggregateOutputType | null
    _avg: CategoryAvgAggregateOutputType | null
    _sum: CategorySumAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryGroupByOutputType[P]>
        }
      >
    >


  export type CategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    subcategories?: boolean | Category$subcategoriesArgs<ExtArgs>
    transactions?: boolean | Category$transactionsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectScalar = {
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "userUuid" | "name" | "createdAt" | "updatedAt", ExtArgs["result"]["category"]>
  export type CategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    subcategories?: boolean | Category$subcategoriesArgs<ExtArgs>
    transactions?: boolean | Category$transactionsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Category"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      subcategories: Prisma.$SubcategoryPayload<ExtArgs>[]
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      uuid: string
      userUuid: string
      name: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["category"]>
    composites: {}
  }

  type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = $Result.GetResult<Prisma.$CategoryPayload, S>

  type CategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategoryCountAggregateInputType | true
    }

  export interface CategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Category'], meta: { name: 'Category' } }
    /**
     * Find zero or one Category that matches the filter.
     * @param {CategoryFindUniqueArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryFindUniqueArgs>(args: SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Category that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategoryFindUniqueOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryFindFirstArgs>(args?: SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Categories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Categories
     * const categories = await prisma.category.findMany()
     * 
     * // Get first 10 Categories
     * const categories = await prisma.category.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryWithIdOnly = await prisma.category.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryFindManyArgs>(args?: SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Category.
     * @param {CategoryCreateArgs} args - Arguments to create a Category.
     * @example
     * // Create one Category
     * const Category = await prisma.category.create({
     *   data: {
     *     // ... data to create a Category
     *   }
     * })
     * 
     */
    create<T extends CategoryCreateArgs>(args: SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Categories.
     * @param {CategoryCreateManyArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryCreateManyArgs>(args?: SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Categories and returns the data saved in the database.
     * @param {CategoryCreateManyAndReturnArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Category.
     * @param {CategoryDeleteArgs} args - Arguments to delete one Category.
     * @example
     * // Delete one Category
     * const Category = await prisma.category.delete({
     *   where: {
     *     // ... filter to delete one Category
     *   }
     * })
     * 
     */
    delete<T extends CategoryDeleteArgs>(args: SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Category.
     * @param {CategoryUpdateArgs} args - Arguments to update one Category.
     * @example
     * // Update one Category
     * const category = await prisma.category.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryUpdateArgs>(args: SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Categories.
     * @param {CategoryDeleteManyArgs} args - Arguments to filter Categories to delete.
     * @example
     * // Delete a few Categories
     * const { count } = await prisma.category.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDeleteManyArgs>(args?: SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryUpdateManyArgs>(args: SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories and returns the data updated in the database.
     * @param {CategoryUpdateManyAndReturnArgs} args - Arguments to update many Categories.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, CategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Category.
     * @param {CategoryUpsertArgs} args - Arguments to update or create a Category.
     * @example
     * // Update or create a Category
     * const category = await prisma.category.upsert({
     *   create: {
     *     // ... data to create a Category
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Category we want to update
     *   }
     * })
     */
    upsert<T extends CategoryUpsertArgs>(args: SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryCountArgs} args - Arguments to filter Categories to count.
     * @example
     * // Count the number of Categories
     * const count = await prisma.category.count({
     *   where: {
     *     // ... the filter for the Categories we want to count
     *   }
     * })
    **/
    count<T extends CategoryCountArgs>(
      args?: Subset<T, CategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategoryAggregateArgs>(args: Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>

    /**
     * Group by Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryGroupByArgs['orderBy'] }
        : { orderBy?: CategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Category model
   */
  readonly fields: CategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Category.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    subcategories<T extends Category$subcategoriesArgs<ExtArgs> = {}>(args?: Subset<T, Category$subcategoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    transactions<T extends Category$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Category$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Category model
   */
  interface CategoryFieldRefs {
    readonly id: FieldRef<"Category", 'Int'>
    readonly uuid: FieldRef<"Category", 'String'>
    readonly userUuid: FieldRef<"Category", 'String'>
    readonly name: FieldRef<"Category", 'String'>
    readonly createdAt: FieldRef<"Category", 'DateTime'>
    readonly updatedAt: FieldRef<"Category", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Category findUnique
   */
  export type CategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findUniqueOrThrow
   */
  export type CategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findFirst
   */
  export type CategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findFirstOrThrow
   */
  export type CategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findMany
   */
  export type CategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Categories to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category create
   */
  export type CategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Category.
     */
    data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
  }

  /**
   * Category createMany
   */
  export type CategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category createManyAndReturn
   */
  export type CategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Category update
   */
  export type CategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Category.
     */
    data: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
    /**
     * Choose, which Category to update.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category updateMany
   */
  export type CategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category updateManyAndReturn
   */
  export type CategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Category upsert
   */
  export type CategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Category to update in case it exists.
     */
    where: CategoryWhereUniqueInput
    /**
     * In case the Category found by the `where` argument doesn't exist, create a new Category with this data.
     */
    create: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
    /**
     * In case the Category was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
  }

  /**
   * Category delete
   */
  export type CategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter which Category to delete.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category deleteMany
   */
  export type CategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Categories to delete
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to delete.
     */
    limit?: number
  }

  /**
   * Category.subcategories
   */
  export type Category$subcategoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    where?: SubcategoryWhereInput
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    cursor?: SubcategoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * Category.transactions
   */
  export type Category$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Category without action
   */
  export type CategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
  }


  /**
   * Model Subcategory
   */

  export type AggregateSubcategory = {
    _count: SubcategoryCountAggregateOutputType | null
    _avg: SubcategoryAvgAggregateOutputType | null
    _sum: SubcategorySumAggregateOutputType | null
    _min: SubcategoryMinAggregateOutputType | null
    _max: SubcategoryMaxAggregateOutputType | null
  }

  export type SubcategoryAvgAggregateOutputType = {
    id: number | null
    categoryId: number | null
  }

  export type SubcategorySumAggregateOutputType = {
    id: number | null
    categoryId: number | null
  }

  export type SubcategoryMinAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    categoryId: number | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubcategoryMaxAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    categoryId: number | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubcategoryCountAggregateOutputType = {
    id: number
    uuid: number
    userUuid: number
    categoryId: number
    name: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SubcategoryAvgAggregateInputType = {
    id?: true
    categoryId?: true
  }

  export type SubcategorySumAggregateInputType = {
    id?: true
    categoryId?: true
  }

  export type SubcategoryMinAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    categoryId?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubcategoryMaxAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    categoryId?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubcategoryCountAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    categoryId?: true
    name?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SubcategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subcategory to aggregate.
     */
    where?: SubcategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subcategories to fetch.
     */
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SubcategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subcategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subcategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Subcategories
    **/
    _count?: true | SubcategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SubcategoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SubcategorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SubcategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SubcategoryMaxAggregateInputType
  }

  export type GetSubcategoryAggregateType<T extends SubcategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateSubcategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubcategory[P]>
      : GetScalarType<T[P], AggregateSubcategory[P]>
  }




  export type SubcategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubcategoryWhereInput
    orderBy?: SubcategoryOrderByWithAggregationInput | SubcategoryOrderByWithAggregationInput[]
    by: SubcategoryScalarFieldEnum[] | SubcategoryScalarFieldEnum
    having?: SubcategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubcategoryCountAggregateInputType | true
    _avg?: SubcategoryAvgAggregateInputType
    _sum?: SubcategorySumAggregateInputType
    _min?: SubcategoryMinAggregateInputType
    _max?: SubcategoryMaxAggregateInputType
  }

  export type SubcategoryGroupByOutputType = {
    id: number
    uuid: string
    userUuid: string
    categoryId: number
    name: string
    createdAt: Date
    updatedAt: Date
    _count: SubcategoryCountAggregateOutputType | null
    _avg: SubcategoryAvgAggregateOutputType | null
    _sum: SubcategorySumAggregateOutputType | null
    _min: SubcategoryMinAggregateOutputType | null
    _max: SubcategoryMaxAggregateOutputType | null
  }

  type GetSubcategoryGroupByPayload<T extends SubcategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubcategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubcategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubcategoryGroupByOutputType[P]>
            : GetScalarType<T[P], SubcategoryGroupByOutputType[P]>
        }
      >
    >


  export type SubcategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    categoryId?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    transactions?: boolean | Subcategory$transactionsArgs<ExtArgs>
    _count?: boolean | SubcategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategory"]>

  export type SubcategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    categoryId?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | CategoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategory"]>

  export type SubcategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    categoryId?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | CategoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategory"]>

  export type SubcategorySelectScalar = {
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    categoryId?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SubcategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "userUuid" | "categoryId" | "name" | "createdAt" | "updatedAt", ExtArgs["result"]["subcategory"]>
  export type SubcategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    transactions?: boolean | Subcategory$transactionsArgs<ExtArgs>
    _count?: boolean | SubcategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SubcategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | CategoryDefaultArgs<ExtArgs>
  }
  export type SubcategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | CategoryDefaultArgs<ExtArgs>
  }

  export type $SubcategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subcategory"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      category: Prisma.$CategoryPayload<ExtArgs>
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      uuid: string
      userUuid: string
      categoryId: number
      name: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["subcategory"]>
    composites: {}
  }

  type SubcategoryGetPayload<S extends boolean | null | undefined | SubcategoryDefaultArgs> = $Result.GetResult<Prisma.$SubcategoryPayload, S>

  type SubcategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SubcategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SubcategoryCountAggregateInputType | true
    }

  export interface SubcategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Subcategory'], meta: { name: 'Subcategory' } }
    /**
     * Find zero or one Subcategory that matches the filter.
     * @param {SubcategoryFindUniqueArgs} args - Arguments to find a Subcategory
     * @example
     * // Get one Subcategory
     * const subcategory = await prisma.subcategory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubcategoryFindUniqueArgs>(args: SelectSubset<T, SubcategoryFindUniqueArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Subcategory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubcategoryFindUniqueOrThrowArgs} args - Arguments to find a Subcategory
     * @example
     * // Get one Subcategory
     * const subcategory = await prisma.subcategory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubcategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, SubcategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subcategory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryFindFirstArgs} args - Arguments to find a Subcategory
     * @example
     * // Get one Subcategory
     * const subcategory = await prisma.subcategory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubcategoryFindFirstArgs>(args?: SelectSubset<T, SubcategoryFindFirstArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subcategory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryFindFirstOrThrowArgs} args - Arguments to find a Subcategory
     * @example
     * // Get one Subcategory
     * const subcategory = await prisma.subcategory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubcategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, SubcategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Subcategories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subcategories
     * const subcategories = await prisma.subcategory.findMany()
     * 
     * // Get first 10 Subcategories
     * const subcategories = await prisma.subcategory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const subcategoryWithIdOnly = await prisma.subcategory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SubcategoryFindManyArgs>(args?: SelectSubset<T, SubcategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Subcategory.
     * @param {SubcategoryCreateArgs} args - Arguments to create a Subcategory.
     * @example
     * // Create one Subcategory
     * const Subcategory = await prisma.subcategory.create({
     *   data: {
     *     // ... data to create a Subcategory
     *   }
     * })
     * 
     */
    create<T extends SubcategoryCreateArgs>(args: SelectSubset<T, SubcategoryCreateArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Subcategories.
     * @param {SubcategoryCreateManyArgs} args - Arguments to create many Subcategories.
     * @example
     * // Create many Subcategories
     * const subcategory = await prisma.subcategory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SubcategoryCreateManyArgs>(args?: SelectSubset<T, SubcategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Subcategories and returns the data saved in the database.
     * @param {SubcategoryCreateManyAndReturnArgs} args - Arguments to create many Subcategories.
     * @example
     * // Create many Subcategories
     * const subcategory = await prisma.subcategory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Subcategories and only return the `id`
     * const subcategoryWithIdOnly = await prisma.subcategory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SubcategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, SubcategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Subcategory.
     * @param {SubcategoryDeleteArgs} args - Arguments to delete one Subcategory.
     * @example
     * // Delete one Subcategory
     * const Subcategory = await prisma.subcategory.delete({
     *   where: {
     *     // ... filter to delete one Subcategory
     *   }
     * })
     * 
     */
    delete<T extends SubcategoryDeleteArgs>(args: SelectSubset<T, SubcategoryDeleteArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Subcategory.
     * @param {SubcategoryUpdateArgs} args - Arguments to update one Subcategory.
     * @example
     * // Update one Subcategory
     * const subcategory = await prisma.subcategory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SubcategoryUpdateArgs>(args: SelectSubset<T, SubcategoryUpdateArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Subcategories.
     * @param {SubcategoryDeleteManyArgs} args - Arguments to filter Subcategories to delete.
     * @example
     * // Delete a few Subcategories
     * const { count } = await prisma.subcategory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SubcategoryDeleteManyArgs>(args?: SelectSubset<T, SubcategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subcategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subcategories
     * const subcategory = await prisma.subcategory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SubcategoryUpdateManyArgs>(args: SelectSubset<T, SubcategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subcategories and returns the data updated in the database.
     * @param {SubcategoryUpdateManyAndReturnArgs} args - Arguments to update many Subcategories.
     * @example
     * // Update many Subcategories
     * const subcategory = await prisma.subcategory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Subcategories and only return the `id`
     * const subcategoryWithIdOnly = await prisma.subcategory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SubcategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, SubcategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Subcategory.
     * @param {SubcategoryUpsertArgs} args - Arguments to update or create a Subcategory.
     * @example
     * // Update or create a Subcategory
     * const subcategory = await prisma.subcategory.upsert({
     *   create: {
     *     // ... data to create a Subcategory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subcategory we want to update
     *   }
     * })
     */
    upsert<T extends SubcategoryUpsertArgs>(args: SelectSubset<T, SubcategoryUpsertArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Subcategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryCountArgs} args - Arguments to filter Subcategories to count.
     * @example
     * // Count the number of Subcategories
     * const count = await prisma.subcategory.count({
     *   where: {
     *     // ... the filter for the Subcategories we want to count
     *   }
     * })
    **/
    count<T extends SubcategoryCountArgs>(
      args?: Subset<T, SubcategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubcategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Subcategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SubcategoryAggregateArgs>(args: Subset<T, SubcategoryAggregateArgs>): Prisma.PrismaPromise<GetSubcategoryAggregateType<T>>

    /**
     * Group by Subcategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SubcategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubcategoryGroupByArgs['orderBy'] }
        : { orderBy?: SubcategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SubcategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubcategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Subcategory model
   */
  readonly fields: SubcategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subcategory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubcategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    category<T extends CategoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CategoryDefaultArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    transactions<T extends Subcategory$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Subcategory$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Subcategory model
   */
  interface SubcategoryFieldRefs {
    readonly id: FieldRef<"Subcategory", 'Int'>
    readonly uuid: FieldRef<"Subcategory", 'String'>
    readonly userUuid: FieldRef<"Subcategory", 'String'>
    readonly categoryId: FieldRef<"Subcategory", 'Int'>
    readonly name: FieldRef<"Subcategory", 'String'>
    readonly createdAt: FieldRef<"Subcategory", 'DateTime'>
    readonly updatedAt: FieldRef<"Subcategory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Subcategory findUnique
   */
  export type SubcategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategory to fetch.
     */
    where: SubcategoryWhereUniqueInput
  }

  /**
   * Subcategory findUniqueOrThrow
   */
  export type SubcategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategory to fetch.
     */
    where: SubcategoryWhereUniqueInput
  }

  /**
   * Subcategory findFirst
   */
  export type SubcategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategory to fetch.
     */
    where?: SubcategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subcategories to fetch.
     */
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subcategories.
     */
    cursor?: SubcategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subcategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subcategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subcategories.
     */
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * Subcategory findFirstOrThrow
   */
  export type SubcategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategory to fetch.
     */
    where?: SubcategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subcategories to fetch.
     */
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subcategories.
     */
    cursor?: SubcategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subcategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subcategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subcategories.
     */
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * Subcategory findMany
   */
  export type SubcategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategories to fetch.
     */
    where?: SubcategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subcategories to fetch.
     */
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Subcategories.
     */
    cursor?: SubcategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subcategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subcategories.
     */
    skip?: number
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * Subcategory create
   */
  export type SubcategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Subcategory.
     */
    data: XOR<SubcategoryCreateInput, SubcategoryUncheckedCreateInput>
  }

  /**
   * Subcategory createMany
   */
  export type SubcategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subcategories.
     */
    data: SubcategoryCreateManyInput | SubcategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subcategory createManyAndReturn
   */
  export type SubcategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * The data used to create many Subcategories.
     */
    data: SubcategoryCreateManyInput | SubcategoryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subcategory update
   */
  export type SubcategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Subcategory.
     */
    data: XOR<SubcategoryUpdateInput, SubcategoryUncheckedUpdateInput>
    /**
     * Choose, which Subcategory to update.
     */
    where: SubcategoryWhereUniqueInput
  }

  /**
   * Subcategory updateMany
   */
  export type SubcategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subcategories.
     */
    data: XOR<SubcategoryUpdateManyMutationInput, SubcategoryUncheckedUpdateManyInput>
    /**
     * Filter which Subcategories to update
     */
    where?: SubcategoryWhereInput
    /**
     * Limit how many Subcategories to update.
     */
    limit?: number
  }

  /**
   * Subcategory updateManyAndReturn
   */
  export type SubcategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * The data used to update Subcategories.
     */
    data: XOR<SubcategoryUpdateManyMutationInput, SubcategoryUncheckedUpdateManyInput>
    /**
     * Filter which Subcategories to update
     */
    where?: SubcategoryWhereInput
    /**
     * Limit how many Subcategories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subcategory upsert
   */
  export type SubcategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Subcategory to update in case it exists.
     */
    where: SubcategoryWhereUniqueInput
    /**
     * In case the Subcategory found by the `where` argument doesn't exist, create a new Subcategory with this data.
     */
    create: XOR<SubcategoryCreateInput, SubcategoryUncheckedCreateInput>
    /**
     * In case the Subcategory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubcategoryUpdateInput, SubcategoryUncheckedUpdateInput>
  }

  /**
   * Subcategory delete
   */
  export type SubcategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter which Subcategory to delete.
     */
    where: SubcategoryWhereUniqueInput
  }

  /**
   * Subcategory deleteMany
   */
  export type SubcategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subcategories to delete
     */
    where?: SubcategoryWhereInput
    /**
     * Limit how many Subcategories to delete.
     */
    limit?: number
  }

  /**
   * Subcategory.transactions
   */
  export type Subcategory$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Subcategory without action
   */
  export type SubcategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
  }


  /**
   * Model Recipient
   */

  export type AggregateRecipient = {
    _count: RecipientCountAggregateOutputType | null
    _avg: RecipientAvgAggregateOutputType | null
    _sum: RecipientSumAggregateOutputType | null
    _min: RecipientMinAggregateOutputType | null
    _max: RecipientMaxAggregateOutputType | null
  }

  export type RecipientAvgAggregateOutputType = {
    id: number | null
  }

  export type RecipientSumAggregateOutputType = {
    id: number | null
  }

  export type RecipientMinAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    displayName: string | null
    normalizedName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecipientMaxAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    displayName: string | null
    normalizedName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecipientCountAggregateOutputType = {
    id: number
    uuid: number
    userUuid: number
    displayName: number
    normalizedName: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RecipientAvgAggregateInputType = {
    id?: true
  }

  export type RecipientSumAggregateInputType = {
    id?: true
  }

  export type RecipientMinAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    displayName?: true
    normalizedName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecipientMaxAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    displayName?: true
    normalizedName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecipientCountAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    displayName?: true
    normalizedName?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RecipientAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Recipient to aggregate.
     */
    where?: RecipientWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Recipients to fetch.
     */
    orderBy?: RecipientOrderByWithRelationInput | RecipientOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RecipientWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Recipients from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Recipients.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Recipients
    **/
    _count?: true | RecipientCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RecipientAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RecipientSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RecipientMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RecipientMaxAggregateInputType
  }

  export type GetRecipientAggregateType<T extends RecipientAggregateArgs> = {
        [P in keyof T & keyof AggregateRecipient]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRecipient[P]>
      : GetScalarType<T[P], AggregateRecipient[P]>
  }




  export type RecipientGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecipientWhereInput
    orderBy?: RecipientOrderByWithAggregationInput | RecipientOrderByWithAggregationInput[]
    by: RecipientScalarFieldEnum[] | RecipientScalarFieldEnum
    having?: RecipientScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RecipientCountAggregateInputType | true
    _avg?: RecipientAvgAggregateInputType
    _sum?: RecipientSumAggregateInputType
    _min?: RecipientMinAggregateInputType
    _max?: RecipientMaxAggregateInputType
  }

  export type RecipientGroupByOutputType = {
    id: number
    uuid: string
    userUuid: string
    displayName: string
    normalizedName: string
    createdAt: Date
    updatedAt: Date
    _count: RecipientCountAggregateOutputType | null
    _avg: RecipientAvgAggregateOutputType | null
    _sum: RecipientSumAggregateOutputType | null
    _min: RecipientMinAggregateOutputType | null
    _max: RecipientMaxAggregateOutputType | null
  }

  type GetRecipientGroupByPayload<T extends RecipientGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RecipientGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RecipientGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RecipientGroupByOutputType[P]>
            : GetScalarType<T[P], RecipientGroupByOutputType[P]>
        }
      >
    >


  export type RecipientSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    displayName?: boolean
    normalizedName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    identifiers?: boolean | Recipient$identifiersArgs<ExtArgs>
    transactions?: boolean | Recipient$transactionsArgs<ExtArgs>
    _count?: boolean | RecipientCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recipient"]>

  export type RecipientSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    displayName?: boolean
    normalizedName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recipient"]>

  export type RecipientSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    displayName?: boolean
    normalizedName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recipient"]>

  export type RecipientSelectScalar = {
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    displayName?: boolean
    normalizedName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type RecipientOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "userUuid" | "displayName" | "normalizedName" | "createdAt" | "updatedAt", ExtArgs["result"]["recipient"]>
  export type RecipientInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    identifiers?: boolean | Recipient$identifiersArgs<ExtArgs>
    transactions?: boolean | Recipient$transactionsArgs<ExtArgs>
    _count?: boolean | RecipientCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type RecipientIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RecipientIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RecipientPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Recipient"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      identifiers: Prisma.$RecipientIdentifierPayload<ExtArgs>[]
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      uuid: string
      userUuid: string
      displayName: string
      normalizedName: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["recipient"]>
    composites: {}
  }

  type RecipientGetPayload<S extends boolean | null | undefined | RecipientDefaultArgs> = $Result.GetResult<Prisma.$RecipientPayload, S>

  type RecipientCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RecipientFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RecipientCountAggregateInputType | true
    }

  export interface RecipientDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Recipient'], meta: { name: 'Recipient' } }
    /**
     * Find zero or one Recipient that matches the filter.
     * @param {RecipientFindUniqueArgs} args - Arguments to find a Recipient
     * @example
     * // Get one Recipient
     * const recipient = await prisma.recipient.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RecipientFindUniqueArgs>(args: SelectSubset<T, RecipientFindUniqueArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Recipient that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RecipientFindUniqueOrThrowArgs} args - Arguments to find a Recipient
     * @example
     * // Get one Recipient
     * const recipient = await prisma.recipient.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RecipientFindUniqueOrThrowArgs>(args: SelectSubset<T, RecipientFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Recipient that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientFindFirstArgs} args - Arguments to find a Recipient
     * @example
     * // Get one Recipient
     * const recipient = await prisma.recipient.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RecipientFindFirstArgs>(args?: SelectSubset<T, RecipientFindFirstArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Recipient that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientFindFirstOrThrowArgs} args - Arguments to find a Recipient
     * @example
     * // Get one Recipient
     * const recipient = await prisma.recipient.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RecipientFindFirstOrThrowArgs>(args?: SelectSubset<T, RecipientFindFirstOrThrowArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Recipients that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Recipients
     * const recipients = await prisma.recipient.findMany()
     * 
     * // Get first 10 Recipients
     * const recipients = await prisma.recipient.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const recipientWithIdOnly = await prisma.recipient.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RecipientFindManyArgs>(args?: SelectSubset<T, RecipientFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Recipient.
     * @param {RecipientCreateArgs} args - Arguments to create a Recipient.
     * @example
     * // Create one Recipient
     * const Recipient = await prisma.recipient.create({
     *   data: {
     *     // ... data to create a Recipient
     *   }
     * })
     * 
     */
    create<T extends RecipientCreateArgs>(args: SelectSubset<T, RecipientCreateArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Recipients.
     * @param {RecipientCreateManyArgs} args - Arguments to create many Recipients.
     * @example
     * // Create many Recipients
     * const recipient = await prisma.recipient.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RecipientCreateManyArgs>(args?: SelectSubset<T, RecipientCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Recipients and returns the data saved in the database.
     * @param {RecipientCreateManyAndReturnArgs} args - Arguments to create many Recipients.
     * @example
     * // Create many Recipients
     * const recipient = await prisma.recipient.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Recipients and only return the `id`
     * const recipientWithIdOnly = await prisma.recipient.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RecipientCreateManyAndReturnArgs>(args?: SelectSubset<T, RecipientCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Recipient.
     * @param {RecipientDeleteArgs} args - Arguments to delete one Recipient.
     * @example
     * // Delete one Recipient
     * const Recipient = await prisma.recipient.delete({
     *   where: {
     *     // ... filter to delete one Recipient
     *   }
     * })
     * 
     */
    delete<T extends RecipientDeleteArgs>(args: SelectSubset<T, RecipientDeleteArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Recipient.
     * @param {RecipientUpdateArgs} args - Arguments to update one Recipient.
     * @example
     * // Update one Recipient
     * const recipient = await prisma.recipient.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RecipientUpdateArgs>(args: SelectSubset<T, RecipientUpdateArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Recipients.
     * @param {RecipientDeleteManyArgs} args - Arguments to filter Recipients to delete.
     * @example
     * // Delete a few Recipients
     * const { count } = await prisma.recipient.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RecipientDeleteManyArgs>(args?: SelectSubset<T, RecipientDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Recipients.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Recipients
     * const recipient = await prisma.recipient.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RecipientUpdateManyArgs>(args: SelectSubset<T, RecipientUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Recipients and returns the data updated in the database.
     * @param {RecipientUpdateManyAndReturnArgs} args - Arguments to update many Recipients.
     * @example
     * // Update many Recipients
     * const recipient = await prisma.recipient.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Recipients and only return the `id`
     * const recipientWithIdOnly = await prisma.recipient.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RecipientUpdateManyAndReturnArgs>(args: SelectSubset<T, RecipientUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Recipient.
     * @param {RecipientUpsertArgs} args - Arguments to update or create a Recipient.
     * @example
     * // Update or create a Recipient
     * const recipient = await prisma.recipient.upsert({
     *   create: {
     *     // ... data to create a Recipient
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Recipient we want to update
     *   }
     * })
     */
    upsert<T extends RecipientUpsertArgs>(args: SelectSubset<T, RecipientUpsertArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Recipients.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientCountArgs} args - Arguments to filter Recipients to count.
     * @example
     * // Count the number of Recipients
     * const count = await prisma.recipient.count({
     *   where: {
     *     // ... the filter for the Recipients we want to count
     *   }
     * })
    **/
    count<T extends RecipientCountArgs>(
      args?: Subset<T, RecipientCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RecipientCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Recipient.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RecipientAggregateArgs>(args: Subset<T, RecipientAggregateArgs>): Prisma.PrismaPromise<GetRecipientAggregateType<T>>

    /**
     * Group by Recipient.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RecipientGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RecipientGroupByArgs['orderBy'] }
        : { orderBy?: RecipientGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RecipientGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecipientGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Recipient model
   */
  readonly fields: RecipientFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Recipient.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RecipientClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    identifiers<T extends Recipient$identifiersArgs<ExtArgs> = {}>(args?: Subset<T, Recipient$identifiersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    transactions<T extends Recipient$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Recipient$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Recipient model
   */
  interface RecipientFieldRefs {
    readonly id: FieldRef<"Recipient", 'Int'>
    readonly uuid: FieldRef<"Recipient", 'String'>
    readonly userUuid: FieldRef<"Recipient", 'String'>
    readonly displayName: FieldRef<"Recipient", 'String'>
    readonly normalizedName: FieldRef<"Recipient", 'String'>
    readonly createdAt: FieldRef<"Recipient", 'DateTime'>
    readonly updatedAt: FieldRef<"Recipient", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Recipient findUnique
   */
  export type RecipientFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * Filter, which Recipient to fetch.
     */
    where: RecipientWhereUniqueInput
  }

  /**
   * Recipient findUniqueOrThrow
   */
  export type RecipientFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * Filter, which Recipient to fetch.
     */
    where: RecipientWhereUniqueInput
  }

  /**
   * Recipient findFirst
   */
  export type RecipientFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * Filter, which Recipient to fetch.
     */
    where?: RecipientWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Recipients to fetch.
     */
    orderBy?: RecipientOrderByWithRelationInput | RecipientOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Recipients.
     */
    cursor?: RecipientWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Recipients from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Recipients.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Recipients.
     */
    distinct?: RecipientScalarFieldEnum | RecipientScalarFieldEnum[]
  }

  /**
   * Recipient findFirstOrThrow
   */
  export type RecipientFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * Filter, which Recipient to fetch.
     */
    where?: RecipientWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Recipients to fetch.
     */
    orderBy?: RecipientOrderByWithRelationInput | RecipientOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Recipients.
     */
    cursor?: RecipientWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Recipients from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Recipients.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Recipients.
     */
    distinct?: RecipientScalarFieldEnum | RecipientScalarFieldEnum[]
  }

  /**
   * Recipient findMany
   */
  export type RecipientFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * Filter, which Recipients to fetch.
     */
    where?: RecipientWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Recipients to fetch.
     */
    orderBy?: RecipientOrderByWithRelationInput | RecipientOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Recipients.
     */
    cursor?: RecipientWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Recipients from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Recipients.
     */
    skip?: number
    distinct?: RecipientScalarFieldEnum | RecipientScalarFieldEnum[]
  }

  /**
   * Recipient create
   */
  export type RecipientCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * The data needed to create a Recipient.
     */
    data: XOR<RecipientCreateInput, RecipientUncheckedCreateInput>
  }

  /**
   * Recipient createMany
   */
  export type RecipientCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Recipients.
     */
    data: RecipientCreateManyInput | RecipientCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Recipient createManyAndReturn
   */
  export type RecipientCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * The data used to create many Recipients.
     */
    data: RecipientCreateManyInput | RecipientCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Recipient update
   */
  export type RecipientUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * The data needed to update a Recipient.
     */
    data: XOR<RecipientUpdateInput, RecipientUncheckedUpdateInput>
    /**
     * Choose, which Recipient to update.
     */
    where: RecipientWhereUniqueInput
  }

  /**
   * Recipient updateMany
   */
  export type RecipientUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Recipients.
     */
    data: XOR<RecipientUpdateManyMutationInput, RecipientUncheckedUpdateManyInput>
    /**
     * Filter which Recipients to update
     */
    where?: RecipientWhereInput
    /**
     * Limit how many Recipients to update.
     */
    limit?: number
  }

  /**
   * Recipient updateManyAndReturn
   */
  export type RecipientUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * The data used to update Recipients.
     */
    data: XOR<RecipientUpdateManyMutationInput, RecipientUncheckedUpdateManyInput>
    /**
     * Filter which Recipients to update
     */
    where?: RecipientWhereInput
    /**
     * Limit how many Recipients to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Recipient upsert
   */
  export type RecipientUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * The filter to search for the Recipient to update in case it exists.
     */
    where: RecipientWhereUniqueInput
    /**
     * In case the Recipient found by the `where` argument doesn't exist, create a new Recipient with this data.
     */
    create: XOR<RecipientCreateInput, RecipientUncheckedCreateInput>
    /**
     * In case the Recipient was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RecipientUpdateInput, RecipientUncheckedUpdateInput>
  }

  /**
   * Recipient delete
   */
  export type RecipientDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
    /**
     * Filter which Recipient to delete.
     */
    where: RecipientWhereUniqueInput
  }

  /**
   * Recipient deleteMany
   */
  export type RecipientDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Recipients to delete
     */
    where?: RecipientWhereInput
    /**
     * Limit how many Recipients to delete.
     */
    limit?: number
  }

  /**
   * Recipient.identifiers
   */
  export type Recipient$identifiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    where?: RecipientIdentifierWhereInput
    orderBy?: RecipientIdentifierOrderByWithRelationInput | RecipientIdentifierOrderByWithRelationInput[]
    cursor?: RecipientIdentifierWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RecipientIdentifierScalarFieldEnum | RecipientIdentifierScalarFieldEnum[]
  }

  /**
   * Recipient.transactions
   */
  export type Recipient$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Recipient without action
   */
  export type RecipientDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recipient
     */
    select?: RecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Recipient
     */
    omit?: RecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientInclude<ExtArgs> | null
  }


  /**
   * Model RecipientIdentifier
   */

  export type AggregateRecipientIdentifier = {
    _count: RecipientIdentifierCountAggregateOutputType | null
    _avg: RecipientIdentifierAvgAggregateOutputType | null
    _sum: RecipientIdentifierSumAggregateOutputType | null
    _min: RecipientIdentifierMinAggregateOutputType | null
    _max: RecipientIdentifierMaxAggregateOutputType | null
  }

  export type RecipientIdentifierAvgAggregateOutputType = {
    id: number | null
    recipientId: number | null
  }

  export type RecipientIdentifierSumAggregateOutputType = {
    id: number | null
    recipientId: number | null
  }

  export type RecipientIdentifierMinAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    recipientId: number | null
    kind: $Enums.RecipientIdentifierKind | null
    value: string | null
    normalizedValue: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecipientIdentifierMaxAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    recipientId: number | null
    kind: $Enums.RecipientIdentifierKind | null
    value: string | null
    normalizedValue: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecipientIdentifierCountAggregateOutputType = {
    id: number
    uuid: number
    userUuid: number
    recipientId: number
    kind: number
    value: number
    normalizedValue: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RecipientIdentifierAvgAggregateInputType = {
    id?: true
    recipientId?: true
  }

  export type RecipientIdentifierSumAggregateInputType = {
    id?: true
    recipientId?: true
  }

  export type RecipientIdentifierMinAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    recipientId?: true
    kind?: true
    value?: true
    normalizedValue?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecipientIdentifierMaxAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    recipientId?: true
    kind?: true
    value?: true
    normalizedValue?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecipientIdentifierCountAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    recipientId?: true
    kind?: true
    value?: true
    normalizedValue?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RecipientIdentifierAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecipientIdentifier to aggregate.
     */
    where?: RecipientIdentifierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecipientIdentifiers to fetch.
     */
    orderBy?: RecipientIdentifierOrderByWithRelationInput | RecipientIdentifierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RecipientIdentifierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecipientIdentifiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecipientIdentifiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RecipientIdentifiers
    **/
    _count?: true | RecipientIdentifierCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RecipientIdentifierAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RecipientIdentifierSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RecipientIdentifierMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RecipientIdentifierMaxAggregateInputType
  }

  export type GetRecipientIdentifierAggregateType<T extends RecipientIdentifierAggregateArgs> = {
        [P in keyof T & keyof AggregateRecipientIdentifier]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRecipientIdentifier[P]>
      : GetScalarType<T[P], AggregateRecipientIdentifier[P]>
  }




  export type RecipientIdentifierGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecipientIdentifierWhereInput
    orderBy?: RecipientIdentifierOrderByWithAggregationInput | RecipientIdentifierOrderByWithAggregationInput[]
    by: RecipientIdentifierScalarFieldEnum[] | RecipientIdentifierScalarFieldEnum
    having?: RecipientIdentifierScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RecipientIdentifierCountAggregateInputType | true
    _avg?: RecipientIdentifierAvgAggregateInputType
    _sum?: RecipientIdentifierSumAggregateInputType
    _min?: RecipientIdentifierMinAggregateInputType
    _max?: RecipientIdentifierMaxAggregateInputType
  }

  export type RecipientIdentifierGroupByOutputType = {
    id: number
    uuid: string
    userUuid: string
    recipientId: number
    kind: $Enums.RecipientIdentifierKind
    value: string
    normalizedValue: string
    createdAt: Date
    updatedAt: Date
    _count: RecipientIdentifierCountAggregateOutputType | null
    _avg: RecipientIdentifierAvgAggregateOutputType | null
    _sum: RecipientIdentifierSumAggregateOutputType | null
    _min: RecipientIdentifierMinAggregateOutputType | null
    _max: RecipientIdentifierMaxAggregateOutputType | null
  }

  type GetRecipientIdentifierGroupByPayload<T extends RecipientIdentifierGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RecipientIdentifierGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RecipientIdentifierGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RecipientIdentifierGroupByOutputType[P]>
            : GetScalarType<T[P], RecipientIdentifierGroupByOutputType[P]>
        }
      >
    >


  export type RecipientIdentifierSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    recipientId?: boolean
    kind?: boolean
    value?: boolean
    normalizedValue?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recipientIdentifier"]>

  export type RecipientIdentifierSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    recipientId?: boolean
    kind?: boolean
    value?: boolean
    normalizedValue?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recipientIdentifier"]>

  export type RecipientIdentifierSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    recipientId?: boolean
    kind?: boolean
    value?: boolean
    normalizedValue?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recipientIdentifier"]>

  export type RecipientIdentifierSelectScalar = {
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    recipientId?: boolean
    kind?: boolean
    value?: boolean
    normalizedValue?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type RecipientIdentifierOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "userUuid" | "recipientId" | "kind" | "value" | "normalizedValue" | "createdAt" | "updatedAt", ExtArgs["result"]["recipientIdentifier"]>
  export type RecipientIdentifierInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
  }
  export type RecipientIdentifierIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
  }
  export type RecipientIdentifierIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
  }

  export type $RecipientIdentifierPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RecipientIdentifier"
    objects: {
      recipient: Prisma.$RecipientPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      uuid: string
      userUuid: string
      recipientId: number
      kind: $Enums.RecipientIdentifierKind
      value: string
      normalizedValue: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["recipientIdentifier"]>
    composites: {}
  }

  type RecipientIdentifierGetPayload<S extends boolean | null | undefined | RecipientIdentifierDefaultArgs> = $Result.GetResult<Prisma.$RecipientIdentifierPayload, S>

  type RecipientIdentifierCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RecipientIdentifierFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RecipientIdentifierCountAggregateInputType | true
    }

  export interface RecipientIdentifierDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RecipientIdentifier'], meta: { name: 'RecipientIdentifier' } }
    /**
     * Find zero or one RecipientIdentifier that matches the filter.
     * @param {RecipientIdentifierFindUniqueArgs} args - Arguments to find a RecipientIdentifier
     * @example
     * // Get one RecipientIdentifier
     * const recipientIdentifier = await prisma.recipientIdentifier.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RecipientIdentifierFindUniqueArgs>(args: SelectSubset<T, RecipientIdentifierFindUniqueArgs<ExtArgs>>): Prisma__RecipientIdentifierClient<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RecipientIdentifier that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RecipientIdentifierFindUniqueOrThrowArgs} args - Arguments to find a RecipientIdentifier
     * @example
     * // Get one RecipientIdentifier
     * const recipientIdentifier = await prisma.recipientIdentifier.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RecipientIdentifierFindUniqueOrThrowArgs>(args: SelectSubset<T, RecipientIdentifierFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RecipientIdentifierClient<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RecipientIdentifier that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientIdentifierFindFirstArgs} args - Arguments to find a RecipientIdentifier
     * @example
     * // Get one RecipientIdentifier
     * const recipientIdentifier = await prisma.recipientIdentifier.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RecipientIdentifierFindFirstArgs>(args?: SelectSubset<T, RecipientIdentifierFindFirstArgs<ExtArgs>>): Prisma__RecipientIdentifierClient<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RecipientIdentifier that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientIdentifierFindFirstOrThrowArgs} args - Arguments to find a RecipientIdentifier
     * @example
     * // Get one RecipientIdentifier
     * const recipientIdentifier = await prisma.recipientIdentifier.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RecipientIdentifierFindFirstOrThrowArgs>(args?: SelectSubset<T, RecipientIdentifierFindFirstOrThrowArgs<ExtArgs>>): Prisma__RecipientIdentifierClient<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RecipientIdentifiers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientIdentifierFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RecipientIdentifiers
     * const recipientIdentifiers = await prisma.recipientIdentifier.findMany()
     * 
     * // Get first 10 RecipientIdentifiers
     * const recipientIdentifiers = await prisma.recipientIdentifier.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const recipientIdentifierWithIdOnly = await prisma.recipientIdentifier.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RecipientIdentifierFindManyArgs>(args?: SelectSubset<T, RecipientIdentifierFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RecipientIdentifier.
     * @param {RecipientIdentifierCreateArgs} args - Arguments to create a RecipientIdentifier.
     * @example
     * // Create one RecipientIdentifier
     * const RecipientIdentifier = await prisma.recipientIdentifier.create({
     *   data: {
     *     // ... data to create a RecipientIdentifier
     *   }
     * })
     * 
     */
    create<T extends RecipientIdentifierCreateArgs>(args: SelectSubset<T, RecipientIdentifierCreateArgs<ExtArgs>>): Prisma__RecipientIdentifierClient<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RecipientIdentifiers.
     * @param {RecipientIdentifierCreateManyArgs} args - Arguments to create many RecipientIdentifiers.
     * @example
     * // Create many RecipientIdentifiers
     * const recipientIdentifier = await prisma.recipientIdentifier.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RecipientIdentifierCreateManyArgs>(args?: SelectSubset<T, RecipientIdentifierCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RecipientIdentifiers and returns the data saved in the database.
     * @param {RecipientIdentifierCreateManyAndReturnArgs} args - Arguments to create many RecipientIdentifiers.
     * @example
     * // Create many RecipientIdentifiers
     * const recipientIdentifier = await prisma.recipientIdentifier.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RecipientIdentifiers and only return the `id`
     * const recipientIdentifierWithIdOnly = await prisma.recipientIdentifier.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RecipientIdentifierCreateManyAndReturnArgs>(args?: SelectSubset<T, RecipientIdentifierCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a RecipientIdentifier.
     * @param {RecipientIdentifierDeleteArgs} args - Arguments to delete one RecipientIdentifier.
     * @example
     * // Delete one RecipientIdentifier
     * const RecipientIdentifier = await prisma.recipientIdentifier.delete({
     *   where: {
     *     // ... filter to delete one RecipientIdentifier
     *   }
     * })
     * 
     */
    delete<T extends RecipientIdentifierDeleteArgs>(args: SelectSubset<T, RecipientIdentifierDeleteArgs<ExtArgs>>): Prisma__RecipientIdentifierClient<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RecipientIdentifier.
     * @param {RecipientIdentifierUpdateArgs} args - Arguments to update one RecipientIdentifier.
     * @example
     * // Update one RecipientIdentifier
     * const recipientIdentifier = await prisma.recipientIdentifier.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RecipientIdentifierUpdateArgs>(args: SelectSubset<T, RecipientIdentifierUpdateArgs<ExtArgs>>): Prisma__RecipientIdentifierClient<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RecipientIdentifiers.
     * @param {RecipientIdentifierDeleteManyArgs} args - Arguments to filter RecipientIdentifiers to delete.
     * @example
     * // Delete a few RecipientIdentifiers
     * const { count } = await prisma.recipientIdentifier.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RecipientIdentifierDeleteManyArgs>(args?: SelectSubset<T, RecipientIdentifierDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RecipientIdentifiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientIdentifierUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RecipientIdentifiers
     * const recipientIdentifier = await prisma.recipientIdentifier.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RecipientIdentifierUpdateManyArgs>(args: SelectSubset<T, RecipientIdentifierUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RecipientIdentifiers and returns the data updated in the database.
     * @param {RecipientIdentifierUpdateManyAndReturnArgs} args - Arguments to update many RecipientIdentifiers.
     * @example
     * // Update many RecipientIdentifiers
     * const recipientIdentifier = await prisma.recipientIdentifier.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more RecipientIdentifiers and only return the `id`
     * const recipientIdentifierWithIdOnly = await prisma.recipientIdentifier.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RecipientIdentifierUpdateManyAndReturnArgs>(args: SelectSubset<T, RecipientIdentifierUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one RecipientIdentifier.
     * @param {RecipientIdentifierUpsertArgs} args - Arguments to update or create a RecipientIdentifier.
     * @example
     * // Update or create a RecipientIdentifier
     * const recipientIdentifier = await prisma.recipientIdentifier.upsert({
     *   create: {
     *     // ... data to create a RecipientIdentifier
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RecipientIdentifier we want to update
     *   }
     * })
     */
    upsert<T extends RecipientIdentifierUpsertArgs>(args: SelectSubset<T, RecipientIdentifierUpsertArgs<ExtArgs>>): Prisma__RecipientIdentifierClient<$Result.GetResult<Prisma.$RecipientIdentifierPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RecipientIdentifiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientIdentifierCountArgs} args - Arguments to filter RecipientIdentifiers to count.
     * @example
     * // Count the number of RecipientIdentifiers
     * const count = await prisma.recipientIdentifier.count({
     *   where: {
     *     // ... the filter for the RecipientIdentifiers we want to count
     *   }
     * })
    **/
    count<T extends RecipientIdentifierCountArgs>(
      args?: Subset<T, RecipientIdentifierCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RecipientIdentifierCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RecipientIdentifier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientIdentifierAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RecipientIdentifierAggregateArgs>(args: Subset<T, RecipientIdentifierAggregateArgs>): Prisma.PrismaPromise<GetRecipientIdentifierAggregateType<T>>

    /**
     * Group by RecipientIdentifier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecipientIdentifierGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RecipientIdentifierGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RecipientIdentifierGroupByArgs['orderBy'] }
        : { orderBy?: RecipientIdentifierGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RecipientIdentifierGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecipientIdentifierGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RecipientIdentifier model
   */
  readonly fields: RecipientIdentifierFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RecipientIdentifier.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RecipientIdentifierClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    recipient<T extends RecipientDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RecipientDefaultArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RecipientIdentifier model
   */
  interface RecipientIdentifierFieldRefs {
    readonly id: FieldRef<"RecipientIdentifier", 'Int'>
    readonly uuid: FieldRef<"RecipientIdentifier", 'String'>
    readonly userUuid: FieldRef<"RecipientIdentifier", 'String'>
    readonly recipientId: FieldRef<"RecipientIdentifier", 'Int'>
    readonly kind: FieldRef<"RecipientIdentifier", 'RecipientIdentifierKind'>
    readonly value: FieldRef<"RecipientIdentifier", 'String'>
    readonly normalizedValue: FieldRef<"RecipientIdentifier", 'String'>
    readonly createdAt: FieldRef<"RecipientIdentifier", 'DateTime'>
    readonly updatedAt: FieldRef<"RecipientIdentifier", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * RecipientIdentifier findUnique
   */
  export type RecipientIdentifierFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * Filter, which RecipientIdentifier to fetch.
     */
    where: RecipientIdentifierWhereUniqueInput
  }

  /**
   * RecipientIdentifier findUniqueOrThrow
   */
  export type RecipientIdentifierFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * Filter, which RecipientIdentifier to fetch.
     */
    where: RecipientIdentifierWhereUniqueInput
  }

  /**
   * RecipientIdentifier findFirst
   */
  export type RecipientIdentifierFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * Filter, which RecipientIdentifier to fetch.
     */
    where?: RecipientIdentifierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecipientIdentifiers to fetch.
     */
    orderBy?: RecipientIdentifierOrderByWithRelationInput | RecipientIdentifierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecipientIdentifiers.
     */
    cursor?: RecipientIdentifierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecipientIdentifiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecipientIdentifiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecipientIdentifiers.
     */
    distinct?: RecipientIdentifierScalarFieldEnum | RecipientIdentifierScalarFieldEnum[]
  }

  /**
   * RecipientIdentifier findFirstOrThrow
   */
  export type RecipientIdentifierFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * Filter, which RecipientIdentifier to fetch.
     */
    where?: RecipientIdentifierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecipientIdentifiers to fetch.
     */
    orderBy?: RecipientIdentifierOrderByWithRelationInput | RecipientIdentifierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecipientIdentifiers.
     */
    cursor?: RecipientIdentifierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecipientIdentifiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecipientIdentifiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecipientIdentifiers.
     */
    distinct?: RecipientIdentifierScalarFieldEnum | RecipientIdentifierScalarFieldEnum[]
  }

  /**
   * RecipientIdentifier findMany
   */
  export type RecipientIdentifierFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * Filter, which RecipientIdentifiers to fetch.
     */
    where?: RecipientIdentifierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecipientIdentifiers to fetch.
     */
    orderBy?: RecipientIdentifierOrderByWithRelationInput | RecipientIdentifierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RecipientIdentifiers.
     */
    cursor?: RecipientIdentifierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecipientIdentifiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecipientIdentifiers.
     */
    skip?: number
    distinct?: RecipientIdentifierScalarFieldEnum | RecipientIdentifierScalarFieldEnum[]
  }

  /**
   * RecipientIdentifier create
   */
  export type RecipientIdentifierCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * The data needed to create a RecipientIdentifier.
     */
    data: XOR<RecipientIdentifierCreateInput, RecipientIdentifierUncheckedCreateInput>
  }

  /**
   * RecipientIdentifier createMany
   */
  export type RecipientIdentifierCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RecipientIdentifiers.
     */
    data: RecipientIdentifierCreateManyInput | RecipientIdentifierCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RecipientIdentifier createManyAndReturn
   */
  export type RecipientIdentifierCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * The data used to create many RecipientIdentifiers.
     */
    data: RecipientIdentifierCreateManyInput | RecipientIdentifierCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RecipientIdentifier update
   */
  export type RecipientIdentifierUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * The data needed to update a RecipientIdentifier.
     */
    data: XOR<RecipientIdentifierUpdateInput, RecipientIdentifierUncheckedUpdateInput>
    /**
     * Choose, which RecipientIdentifier to update.
     */
    where: RecipientIdentifierWhereUniqueInput
  }

  /**
   * RecipientIdentifier updateMany
   */
  export type RecipientIdentifierUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RecipientIdentifiers.
     */
    data: XOR<RecipientIdentifierUpdateManyMutationInput, RecipientIdentifierUncheckedUpdateManyInput>
    /**
     * Filter which RecipientIdentifiers to update
     */
    where?: RecipientIdentifierWhereInput
    /**
     * Limit how many RecipientIdentifiers to update.
     */
    limit?: number
  }

  /**
   * RecipientIdentifier updateManyAndReturn
   */
  export type RecipientIdentifierUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * The data used to update RecipientIdentifiers.
     */
    data: XOR<RecipientIdentifierUpdateManyMutationInput, RecipientIdentifierUncheckedUpdateManyInput>
    /**
     * Filter which RecipientIdentifiers to update
     */
    where?: RecipientIdentifierWhereInput
    /**
     * Limit how many RecipientIdentifiers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * RecipientIdentifier upsert
   */
  export type RecipientIdentifierUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * The filter to search for the RecipientIdentifier to update in case it exists.
     */
    where: RecipientIdentifierWhereUniqueInput
    /**
     * In case the RecipientIdentifier found by the `where` argument doesn't exist, create a new RecipientIdentifier with this data.
     */
    create: XOR<RecipientIdentifierCreateInput, RecipientIdentifierUncheckedCreateInput>
    /**
     * In case the RecipientIdentifier was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RecipientIdentifierUpdateInput, RecipientIdentifierUncheckedUpdateInput>
  }

  /**
   * RecipientIdentifier delete
   */
  export type RecipientIdentifierDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
    /**
     * Filter which RecipientIdentifier to delete.
     */
    where: RecipientIdentifierWhereUniqueInput
  }

  /**
   * RecipientIdentifier deleteMany
   */
  export type RecipientIdentifierDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecipientIdentifiers to delete
     */
    where?: RecipientIdentifierWhereInput
    /**
     * Limit how many RecipientIdentifiers to delete.
     */
    limit?: number
  }

  /**
   * RecipientIdentifier without action
   */
  export type RecipientIdentifierDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecipientIdentifier
     */
    select?: RecipientIdentifierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecipientIdentifier
     */
    omit?: RecipientIdentifierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecipientIdentifierInclude<ExtArgs> | null
  }


  /**
   * Model Transaction
   */

  export type AggregateTransaction = {
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  export type TransactionAvgAggregateOutputType = {
    id: number | null
    recipientId: number | null
    categoryId: number | null
    subcategoryId: number | null
    amount: Decimal | null
  }

  export type TransactionSumAggregateOutputType = {
    id: number | null
    recipientId: number | null
    categoryId: number | null
    subcategoryId: number | null
    amount: Decimal | null
  }

  export type TransactionMinAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    recipientId: number | null
    categoryId: number | null
    subcategoryId: number | null
    amount: Decimal | null
    currency: string | null
    type: $Enums.TransactionType | null
    source: $Enums.TransactionSource | null
    recipientRaw: string | null
    recipientName: string | null
    reference: string | null
    accountLabel: string | null
    remarks: string | null
    locationRaw: string | null
    timestamp: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TransactionMaxAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    recipientId: number | null
    categoryId: number | null
    subcategoryId: number | null
    amount: Decimal | null
    currency: string | null
    type: $Enums.TransactionType | null
    source: $Enums.TransactionSource | null
    recipientRaw: string | null
    recipientName: string | null
    reference: string | null
    accountLabel: string | null
    remarks: string | null
    locationRaw: string | null
    timestamp: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TransactionCountAggregateOutputType = {
    id: number
    uuid: number
    userUuid: number
    recipientId: number
    categoryId: number
    subcategoryId: number
    amount: number
    currency: number
    type: number
    source: number
    recipientRaw: number
    recipientName: number
    reference: number
    accountLabel: number
    remarks: number
    locationRaw: number
    timestamp: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TransactionAvgAggregateInputType = {
    id?: true
    recipientId?: true
    categoryId?: true
    subcategoryId?: true
    amount?: true
  }

  export type TransactionSumAggregateInputType = {
    id?: true
    recipientId?: true
    categoryId?: true
    subcategoryId?: true
    amount?: true
  }

  export type TransactionMinAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    recipientId?: true
    categoryId?: true
    subcategoryId?: true
    amount?: true
    currency?: true
    type?: true
    source?: true
    recipientRaw?: true
    recipientName?: true
    reference?: true
    accountLabel?: true
    remarks?: true
    locationRaw?: true
    timestamp?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TransactionMaxAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    recipientId?: true
    categoryId?: true
    subcategoryId?: true
    amount?: true
    currency?: true
    type?: true
    source?: true
    recipientRaw?: true
    recipientName?: true
    reference?: true
    accountLabel?: true
    remarks?: true
    locationRaw?: true
    timestamp?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TransactionCountAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    recipientId?: true
    categoryId?: true
    subcategoryId?: true
    amount?: true
    currency?: true
    type?: true
    source?: true
    recipientRaw?: true
    recipientName?: true
    reference?: true
    accountLabel?: true
    remarks?: true
    locationRaw?: true
    timestamp?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transaction to aggregate.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Transactions
    **/
    _count?: true | TransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TransactionMaxAggregateInputType
  }

  export type GetTransactionAggregateType<T extends TransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTransaction[P]>
      : GetScalarType<T[P], AggregateTransaction[P]>
  }




  export type TransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithAggregationInput | TransactionOrderByWithAggregationInput[]
    by: TransactionScalarFieldEnum[] | TransactionScalarFieldEnum
    having?: TransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TransactionCountAggregateInputType | true
    _avg?: TransactionAvgAggregateInputType
    _sum?: TransactionSumAggregateInputType
    _min?: TransactionMinAggregateInputType
    _max?: TransactionMaxAggregateInputType
  }

  export type TransactionGroupByOutputType = {
    id: number
    uuid: string
    userUuid: string
    recipientId: number
    categoryId: number | null
    subcategoryId: number | null
    amount: Decimal
    currency: string
    type: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName: string | null
    reference: string | null
    accountLabel: string | null
    remarks: string | null
    locationRaw: string | null
    timestamp: Date
    createdAt: Date
    updatedAt: Date
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  type GetTransactionGroupByPayload<T extends TransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TransactionGroupByOutputType[P]>
            : GetScalarType<T[P], TransactionGroupByOutputType[P]>
        }
      >
    >


  export type TransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    recipientId?: boolean
    categoryId?: boolean
    subcategoryId?: boolean
    amount?: boolean
    currency?: boolean
    type?: boolean
    source?: boolean
    recipientRaw?: boolean
    recipientName?: boolean
    reference?: boolean
    accountLabel?: boolean
    remarks?: boolean
    locationRaw?: boolean
    timestamp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
    category?: boolean | Transaction$categoryArgs<ExtArgs>
    subcategory?: boolean | Transaction$subcategoryArgs<ExtArgs>
    rawMessages?: boolean | Transaction$rawMessagesArgs<ExtArgs>
    _count?: boolean | TransactionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    recipientId?: boolean
    categoryId?: boolean
    subcategoryId?: boolean
    amount?: boolean
    currency?: boolean
    type?: boolean
    source?: boolean
    recipientRaw?: boolean
    recipientName?: boolean
    reference?: boolean
    accountLabel?: boolean
    remarks?: boolean
    locationRaw?: boolean
    timestamp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
    category?: boolean | Transaction$categoryArgs<ExtArgs>
    subcategory?: boolean | Transaction$subcategoryArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    recipientId?: boolean
    categoryId?: boolean
    subcategoryId?: boolean
    amount?: boolean
    currency?: boolean
    type?: boolean
    source?: boolean
    recipientRaw?: boolean
    recipientName?: boolean
    reference?: boolean
    accountLabel?: boolean
    remarks?: boolean
    locationRaw?: boolean
    timestamp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
    category?: boolean | Transaction$categoryArgs<ExtArgs>
    subcategory?: boolean | Transaction$subcategoryArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectScalar = {
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    recipientId?: boolean
    categoryId?: boolean
    subcategoryId?: boolean
    amount?: boolean
    currency?: boolean
    type?: boolean
    source?: boolean
    recipientRaw?: boolean
    recipientName?: boolean
    reference?: boolean
    accountLabel?: boolean
    remarks?: boolean
    locationRaw?: boolean
    timestamp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TransactionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "userUuid" | "recipientId" | "categoryId" | "subcategoryId" | "amount" | "currency" | "type" | "source" | "recipientRaw" | "recipientName" | "reference" | "accountLabel" | "remarks" | "locationRaw" | "timestamp" | "createdAt" | "updatedAt", ExtArgs["result"]["transaction"]>
  export type TransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
    category?: boolean | Transaction$categoryArgs<ExtArgs>
    subcategory?: boolean | Transaction$subcategoryArgs<ExtArgs>
    rawMessages?: boolean | Transaction$rawMessagesArgs<ExtArgs>
    _count?: boolean | TransactionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
    category?: boolean | Transaction$categoryArgs<ExtArgs>
    subcategory?: boolean | Transaction$subcategoryArgs<ExtArgs>
  }
  export type TransactionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    recipient?: boolean | RecipientDefaultArgs<ExtArgs>
    category?: boolean | Transaction$categoryArgs<ExtArgs>
    subcategory?: boolean | Transaction$subcategoryArgs<ExtArgs>
  }

  export type $TransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Transaction"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      recipient: Prisma.$RecipientPayload<ExtArgs>
      category: Prisma.$CategoryPayload<ExtArgs> | null
      subcategory: Prisma.$SubcategoryPayload<ExtArgs> | null
      rawMessages: Prisma.$RawMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      uuid: string
      userUuid: string
      recipientId: number
      categoryId: number | null
      subcategoryId: number | null
      amount: Prisma.Decimal
      currency: string
      type: $Enums.TransactionType
      source: $Enums.TransactionSource
      recipientRaw: string
      recipientName: string | null
      reference: string | null
      accountLabel: string | null
      remarks: string | null
      locationRaw: string | null
      timestamp: Date
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["transaction"]>
    composites: {}
  }

  type TransactionGetPayload<S extends boolean | null | undefined | TransactionDefaultArgs> = $Result.GetResult<Prisma.$TransactionPayload, S>

  type TransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TransactionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TransactionCountAggregateInputType | true
    }

  export interface TransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Transaction'], meta: { name: 'Transaction' } }
    /**
     * Find zero or one Transaction that matches the filter.
     * @param {TransactionFindUniqueArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TransactionFindUniqueArgs>(args: SelectSubset<T, TransactionFindUniqueArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Transaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TransactionFindUniqueOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, TransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Transaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TransactionFindFirstArgs>(args?: SelectSubset<T, TransactionFindFirstArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Transaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, TransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Transactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Transactions
     * const transactions = await prisma.transaction.findMany()
     * 
     * // Get first 10 Transactions
     * const transactions = await prisma.transaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const transactionWithIdOnly = await prisma.transaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TransactionFindManyArgs>(args?: SelectSubset<T, TransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Transaction.
     * @param {TransactionCreateArgs} args - Arguments to create a Transaction.
     * @example
     * // Create one Transaction
     * const Transaction = await prisma.transaction.create({
     *   data: {
     *     // ... data to create a Transaction
     *   }
     * })
     * 
     */
    create<T extends TransactionCreateArgs>(args: SelectSubset<T, TransactionCreateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Transactions.
     * @param {TransactionCreateManyArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TransactionCreateManyArgs>(args?: SelectSubset<T, TransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Transactions and returns the data saved in the database.
     * @param {TransactionCreateManyAndReturnArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, TransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Transaction.
     * @param {TransactionDeleteArgs} args - Arguments to delete one Transaction.
     * @example
     * // Delete one Transaction
     * const Transaction = await prisma.transaction.delete({
     *   where: {
     *     // ... filter to delete one Transaction
     *   }
     * })
     * 
     */
    delete<T extends TransactionDeleteArgs>(args: SelectSubset<T, TransactionDeleteArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Transaction.
     * @param {TransactionUpdateArgs} args - Arguments to update one Transaction.
     * @example
     * // Update one Transaction
     * const transaction = await prisma.transaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TransactionUpdateArgs>(args: SelectSubset<T, TransactionUpdateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Transactions.
     * @param {TransactionDeleteManyArgs} args - Arguments to filter Transactions to delete.
     * @example
     * // Delete a few Transactions
     * const { count } = await prisma.transaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TransactionDeleteManyArgs>(args?: SelectSubset<T, TransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TransactionUpdateManyArgs>(args: SelectSubset<T, TransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions and returns the data updated in the database.
     * @param {TransactionUpdateManyAndReturnArgs} args - Arguments to update many Transactions.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TransactionUpdateManyAndReturnArgs>(args: SelectSubset<T, TransactionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Transaction.
     * @param {TransactionUpsertArgs} args - Arguments to update or create a Transaction.
     * @example
     * // Update or create a Transaction
     * const transaction = await prisma.transaction.upsert({
     *   create: {
     *     // ... data to create a Transaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Transaction we want to update
     *   }
     * })
     */
    upsert<T extends TransactionUpsertArgs>(args: SelectSubset<T, TransactionUpsertArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionCountArgs} args - Arguments to filter Transactions to count.
     * @example
     * // Count the number of Transactions
     * const count = await prisma.transaction.count({
     *   where: {
     *     // ... the filter for the Transactions we want to count
     *   }
     * })
    **/
    count<T extends TransactionCountArgs>(
      args?: Subset<T, TransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TransactionAggregateArgs>(args: Subset<T, TransactionAggregateArgs>): Prisma.PrismaPromise<GetTransactionAggregateType<T>>

    /**
     * Group by Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TransactionGroupByArgs['orderBy'] }
        : { orderBy?: TransactionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Transaction model
   */
  readonly fields: TransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Transaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    recipient<T extends RecipientDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RecipientDefaultArgs<ExtArgs>>): Prisma__RecipientClient<$Result.GetResult<Prisma.$RecipientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    category<T extends Transaction$categoryArgs<ExtArgs> = {}>(args?: Subset<T, Transaction$categoryArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    subcategory<T extends Transaction$subcategoryArgs<ExtArgs> = {}>(args?: Subset<T, Transaction$subcategoryArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    rawMessages<T extends Transaction$rawMessagesArgs<ExtArgs> = {}>(args?: Subset<T, Transaction$rawMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Transaction model
   */
  interface TransactionFieldRefs {
    readonly id: FieldRef<"Transaction", 'Int'>
    readonly uuid: FieldRef<"Transaction", 'String'>
    readonly userUuid: FieldRef<"Transaction", 'String'>
    readonly recipientId: FieldRef<"Transaction", 'Int'>
    readonly categoryId: FieldRef<"Transaction", 'Int'>
    readonly subcategoryId: FieldRef<"Transaction", 'Int'>
    readonly amount: FieldRef<"Transaction", 'Decimal'>
    readonly currency: FieldRef<"Transaction", 'String'>
    readonly type: FieldRef<"Transaction", 'TransactionType'>
    readonly source: FieldRef<"Transaction", 'TransactionSource'>
    readonly recipientRaw: FieldRef<"Transaction", 'String'>
    readonly recipientName: FieldRef<"Transaction", 'String'>
    readonly reference: FieldRef<"Transaction", 'String'>
    readonly accountLabel: FieldRef<"Transaction", 'String'>
    readonly remarks: FieldRef<"Transaction", 'String'>
    readonly locationRaw: FieldRef<"Transaction", 'String'>
    readonly timestamp: FieldRef<"Transaction", 'DateTime'>
    readonly createdAt: FieldRef<"Transaction", 'DateTime'>
    readonly updatedAt: FieldRef<"Transaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Transaction findUnique
   */
  export type TransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findUniqueOrThrow
   */
  export type TransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findFirst
   */
  export type TransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findFirstOrThrow
   */
  export type TransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findMany
   */
  export type TransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transactions to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction create
   */
  export type TransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a Transaction.
     */
    data: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
  }

  /**
   * Transaction createMany
   */
  export type TransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Transaction createManyAndReturn
   */
  export type TransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction update
   */
  export type TransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a Transaction.
     */
    data: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
    /**
     * Choose, which Transaction to update.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction updateMany
   */
  export type TransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to update.
     */
    limit?: number
  }

  /**
   * Transaction updateManyAndReturn
   */
  export type TransactionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction upsert
   */
  export type TransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the Transaction to update in case it exists.
     */
    where: TransactionWhereUniqueInput
    /**
     * In case the Transaction found by the `where` argument doesn't exist, create a new Transaction with this data.
     */
    create: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
    /**
     * In case the Transaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
  }

  /**
   * Transaction delete
   */
  export type TransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter which Transaction to delete.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction deleteMany
   */
  export type TransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transactions to delete
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to delete.
     */
    limit?: number
  }

  /**
   * Transaction.category
   */
  export type Transaction$categoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
  }

  /**
   * Transaction.subcategory
   */
  export type Transaction$subcategoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    where?: SubcategoryWhereInput
  }

  /**
   * Transaction.rawMessages
   */
  export type Transaction$rawMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    where?: RawMessageWhereInput
    orderBy?: RawMessageOrderByWithRelationInput | RawMessageOrderByWithRelationInput[]
    cursor?: RawMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RawMessageScalarFieldEnum | RawMessageScalarFieldEnum[]
  }

  /**
   * Transaction without action
   */
  export type TransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
  }


  /**
   * Model RawMessage
   */

  export type AggregateRawMessage = {
    _count: RawMessageCountAggregateOutputType | null
    _avg: RawMessageAvgAggregateOutputType | null
    _sum: RawMessageSumAggregateOutputType | null
    _min: RawMessageMinAggregateOutputType | null
    _max: RawMessageMaxAggregateOutputType | null
  }

  export type RawMessageAvgAggregateOutputType = {
    id: number | null
    transactionId: number | null
  }

  export type RawMessageSumAggregateOutputType = {
    id: number | null
    transactionId: number | null
  }

  export type RawMessageMinAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    transactionId: number | null
    body: string | null
    source: $Enums.RawMessageSource | null
    parseStatus: $Enums.ParseStatus | null
    parserName: string | null
    failureReason: string | null
    locationRaw: string | null
    receivedAt: Date | null
    createdAt: Date | null
  }

  export type RawMessageMaxAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    transactionId: number | null
    body: string | null
    source: $Enums.RawMessageSource | null
    parseStatus: $Enums.ParseStatus | null
    parserName: string | null
    failureReason: string | null
    locationRaw: string | null
    receivedAt: Date | null
    createdAt: Date | null
  }

  export type RawMessageCountAggregateOutputType = {
    id: number
    uuid: number
    userUuid: number
    transactionId: number
    body: number
    source: number
    parseStatus: number
    parserName: number
    failureReason: number
    parsedPayload: number
    locationRaw: number
    receivedAt: number
    createdAt: number
    _all: number
  }


  export type RawMessageAvgAggregateInputType = {
    id?: true
    transactionId?: true
  }

  export type RawMessageSumAggregateInputType = {
    id?: true
    transactionId?: true
  }

  export type RawMessageMinAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    transactionId?: true
    body?: true
    source?: true
    parseStatus?: true
    parserName?: true
    failureReason?: true
    locationRaw?: true
    receivedAt?: true
    createdAt?: true
  }

  export type RawMessageMaxAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    transactionId?: true
    body?: true
    source?: true
    parseStatus?: true
    parserName?: true
    failureReason?: true
    locationRaw?: true
    receivedAt?: true
    createdAt?: true
  }

  export type RawMessageCountAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    transactionId?: true
    body?: true
    source?: true
    parseStatus?: true
    parserName?: true
    failureReason?: true
    parsedPayload?: true
    locationRaw?: true
    receivedAt?: true
    createdAt?: true
    _all?: true
  }

  export type RawMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RawMessage to aggregate.
     */
    where?: RawMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RawMessages to fetch.
     */
    orderBy?: RawMessageOrderByWithRelationInput | RawMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RawMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RawMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RawMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RawMessages
    **/
    _count?: true | RawMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RawMessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RawMessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RawMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RawMessageMaxAggregateInputType
  }

  export type GetRawMessageAggregateType<T extends RawMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateRawMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRawMessage[P]>
      : GetScalarType<T[P], AggregateRawMessage[P]>
  }




  export type RawMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RawMessageWhereInput
    orderBy?: RawMessageOrderByWithAggregationInput | RawMessageOrderByWithAggregationInput[]
    by: RawMessageScalarFieldEnum[] | RawMessageScalarFieldEnum
    having?: RawMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RawMessageCountAggregateInputType | true
    _avg?: RawMessageAvgAggregateInputType
    _sum?: RawMessageSumAggregateInputType
    _min?: RawMessageMinAggregateInputType
    _max?: RawMessageMaxAggregateInputType
  }

  export type RawMessageGroupByOutputType = {
    id: number
    uuid: string
    userUuid: string
    transactionId: number | null
    body: string
    source: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName: string | null
    failureReason: string | null
    parsedPayload: JsonValue | null
    locationRaw: string | null
    receivedAt: Date
    createdAt: Date
    _count: RawMessageCountAggregateOutputType | null
    _avg: RawMessageAvgAggregateOutputType | null
    _sum: RawMessageSumAggregateOutputType | null
    _min: RawMessageMinAggregateOutputType | null
    _max: RawMessageMaxAggregateOutputType | null
  }

  type GetRawMessageGroupByPayload<T extends RawMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RawMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RawMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RawMessageGroupByOutputType[P]>
            : GetScalarType<T[P], RawMessageGroupByOutputType[P]>
        }
      >
    >


  export type RawMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    transactionId?: boolean
    body?: boolean
    source?: boolean
    parseStatus?: boolean
    parserName?: boolean
    failureReason?: boolean
    parsedPayload?: boolean
    locationRaw?: boolean
    receivedAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    transaction?: boolean | RawMessage$transactionArgs<ExtArgs>
  }, ExtArgs["result"]["rawMessage"]>

  export type RawMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    transactionId?: boolean
    body?: boolean
    source?: boolean
    parseStatus?: boolean
    parserName?: boolean
    failureReason?: boolean
    parsedPayload?: boolean
    locationRaw?: boolean
    receivedAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    transaction?: boolean | RawMessage$transactionArgs<ExtArgs>
  }, ExtArgs["result"]["rawMessage"]>

  export type RawMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    transactionId?: boolean
    body?: boolean
    source?: boolean
    parseStatus?: boolean
    parserName?: boolean
    failureReason?: boolean
    parsedPayload?: boolean
    locationRaw?: boolean
    receivedAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    transaction?: boolean | RawMessage$transactionArgs<ExtArgs>
  }, ExtArgs["result"]["rawMessage"]>

  export type RawMessageSelectScalar = {
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    transactionId?: boolean
    body?: boolean
    source?: boolean
    parseStatus?: boolean
    parserName?: boolean
    failureReason?: boolean
    parsedPayload?: boolean
    locationRaw?: boolean
    receivedAt?: boolean
    createdAt?: boolean
  }

  export type RawMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "userUuid" | "transactionId" | "body" | "source" | "parseStatus" | "parserName" | "failureReason" | "parsedPayload" | "locationRaw" | "receivedAt" | "createdAt", ExtArgs["result"]["rawMessage"]>
  export type RawMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    transaction?: boolean | RawMessage$transactionArgs<ExtArgs>
  }
  export type RawMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    transaction?: boolean | RawMessage$transactionArgs<ExtArgs>
  }
  export type RawMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    transaction?: boolean | RawMessage$transactionArgs<ExtArgs>
  }

  export type $RawMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RawMessage"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      transaction: Prisma.$TransactionPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      uuid: string
      userUuid: string
      transactionId: number | null
      body: string
      source: $Enums.RawMessageSource
      parseStatus: $Enums.ParseStatus
      parserName: string | null
      failureReason: string | null
      parsedPayload: Prisma.JsonValue | null
      locationRaw: string | null
      receivedAt: Date
      createdAt: Date
    }, ExtArgs["result"]["rawMessage"]>
    composites: {}
  }

  type RawMessageGetPayload<S extends boolean | null | undefined | RawMessageDefaultArgs> = $Result.GetResult<Prisma.$RawMessagePayload, S>

  type RawMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RawMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RawMessageCountAggregateInputType | true
    }

  export interface RawMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RawMessage'], meta: { name: 'RawMessage' } }
    /**
     * Find zero or one RawMessage that matches the filter.
     * @param {RawMessageFindUniqueArgs} args - Arguments to find a RawMessage
     * @example
     * // Get one RawMessage
     * const rawMessage = await prisma.rawMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RawMessageFindUniqueArgs>(args: SelectSubset<T, RawMessageFindUniqueArgs<ExtArgs>>): Prisma__RawMessageClient<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RawMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RawMessageFindUniqueOrThrowArgs} args - Arguments to find a RawMessage
     * @example
     * // Get one RawMessage
     * const rawMessage = await prisma.rawMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RawMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, RawMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RawMessageClient<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RawMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RawMessageFindFirstArgs} args - Arguments to find a RawMessage
     * @example
     * // Get one RawMessage
     * const rawMessage = await prisma.rawMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RawMessageFindFirstArgs>(args?: SelectSubset<T, RawMessageFindFirstArgs<ExtArgs>>): Prisma__RawMessageClient<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RawMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RawMessageFindFirstOrThrowArgs} args - Arguments to find a RawMessage
     * @example
     * // Get one RawMessage
     * const rawMessage = await prisma.rawMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RawMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, RawMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__RawMessageClient<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RawMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RawMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RawMessages
     * const rawMessages = await prisma.rawMessage.findMany()
     * 
     * // Get first 10 RawMessages
     * const rawMessages = await prisma.rawMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const rawMessageWithIdOnly = await prisma.rawMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RawMessageFindManyArgs>(args?: SelectSubset<T, RawMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RawMessage.
     * @param {RawMessageCreateArgs} args - Arguments to create a RawMessage.
     * @example
     * // Create one RawMessage
     * const RawMessage = await prisma.rawMessage.create({
     *   data: {
     *     // ... data to create a RawMessage
     *   }
     * })
     * 
     */
    create<T extends RawMessageCreateArgs>(args: SelectSubset<T, RawMessageCreateArgs<ExtArgs>>): Prisma__RawMessageClient<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RawMessages.
     * @param {RawMessageCreateManyArgs} args - Arguments to create many RawMessages.
     * @example
     * // Create many RawMessages
     * const rawMessage = await prisma.rawMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RawMessageCreateManyArgs>(args?: SelectSubset<T, RawMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RawMessages and returns the data saved in the database.
     * @param {RawMessageCreateManyAndReturnArgs} args - Arguments to create many RawMessages.
     * @example
     * // Create many RawMessages
     * const rawMessage = await prisma.rawMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RawMessages and only return the `id`
     * const rawMessageWithIdOnly = await prisma.rawMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RawMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, RawMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a RawMessage.
     * @param {RawMessageDeleteArgs} args - Arguments to delete one RawMessage.
     * @example
     * // Delete one RawMessage
     * const RawMessage = await prisma.rawMessage.delete({
     *   where: {
     *     // ... filter to delete one RawMessage
     *   }
     * })
     * 
     */
    delete<T extends RawMessageDeleteArgs>(args: SelectSubset<T, RawMessageDeleteArgs<ExtArgs>>): Prisma__RawMessageClient<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RawMessage.
     * @param {RawMessageUpdateArgs} args - Arguments to update one RawMessage.
     * @example
     * // Update one RawMessage
     * const rawMessage = await prisma.rawMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RawMessageUpdateArgs>(args: SelectSubset<T, RawMessageUpdateArgs<ExtArgs>>): Prisma__RawMessageClient<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RawMessages.
     * @param {RawMessageDeleteManyArgs} args - Arguments to filter RawMessages to delete.
     * @example
     * // Delete a few RawMessages
     * const { count } = await prisma.rawMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RawMessageDeleteManyArgs>(args?: SelectSubset<T, RawMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RawMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RawMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RawMessages
     * const rawMessage = await prisma.rawMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RawMessageUpdateManyArgs>(args: SelectSubset<T, RawMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RawMessages and returns the data updated in the database.
     * @param {RawMessageUpdateManyAndReturnArgs} args - Arguments to update many RawMessages.
     * @example
     * // Update many RawMessages
     * const rawMessage = await prisma.rawMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more RawMessages and only return the `id`
     * const rawMessageWithIdOnly = await prisma.rawMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RawMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, RawMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one RawMessage.
     * @param {RawMessageUpsertArgs} args - Arguments to update or create a RawMessage.
     * @example
     * // Update or create a RawMessage
     * const rawMessage = await prisma.rawMessage.upsert({
     *   create: {
     *     // ... data to create a RawMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RawMessage we want to update
     *   }
     * })
     */
    upsert<T extends RawMessageUpsertArgs>(args: SelectSubset<T, RawMessageUpsertArgs<ExtArgs>>): Prisma__RawMessageClient<$Result.GetResult<Prisma.$RawMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RawMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RawMessageCountArgs} args - Arguments to filter RawMessages to count.
     * @example
     * // Count the number of RawMessages
     * const count = await prisma.rawMessage.count({
     *   where: {
     *     // ... the filter for the RawMessages we want to count
     *   }
     * })
    **/
    count<T extends RawMessageCountArgs>(
      args?: Subset<T, RawMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RawMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RawMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RawMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RawMessageAggregateArgs>(args: Subset<T, RawMessageAggregateArgs>): Prisma.PrismaPromise<GetRawMessageAggregateType<T>>

    /**
     * Group by RawMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RawMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RawMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RawMessageGroupByArgs['orderBy'] }
        : { orderBy?: RawMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RawMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRawMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RawMessage model
   */
  readonly fields: RawMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RawMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RawMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    transaction<T extends RawMessage$transactionArgs<ExtArgs> = {}>(args?: Subset<T, RawMessage$transactionArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RawMessage model
   */
  interface RawMessageFieldRefs {
    readonly id: FieldRef<"RawMessage", 'Int'>
    readonly uuid: FieldRef<"RawMessage", 'String'>
    readonly userUuid: FieldRef<"RawMessage", 'String'>
    readonly transactionId: FieldRef<"RawMessage", 'Int'>
    readonly body: FieldRef<"RawMessage", 'String'>
    readonly source: FieldRef<"RawMessage", 'RawMessageSource'>
    readonly parseStatus: FieldRef<"RawMessage", 'ParseStatus'>
    readonly parserName: FieldRef<"RawMessage", 'String'>
    readonly failureReason: FieldRef<"RawMessage", 'String'>
    readonly parsedPayload: FieldRef<"RawMessage", 'Json'>
    readonly locationRaw: FieldRef<"RawMessage", 'String'>
    readonly receivedAt: FieldRef<"RawMessage", 'DateTime'>
    readonly createdAt: FieldRef<"RawMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * RawMessage findUnique
   */
  export type RawMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * Filter, which RawMessage to fetch.
     */
    where: RawMessageWhereUniqueInput
  }

  /**
   * RawMessage findUniqueOrThrow
   */
  export type RawMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * Filter, which RawMessage to fetch.
     */
    where: RawMessageWhereUniqueInput
  }

  /**
   * RawMessage findFirst
   */
  export type RawMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * Filter, which RawMessage to fetch.
     */
    where?: RawMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RawMessages to fetch.
     */
    orderBy?: RawMessageOrderByWithRelationInput | RawMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RawMessages.
     */
    cursor?: RawMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RawMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RawMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RawMessages.
     */
    distinct?: RawMessageScalarFieldEnum | RawMessageScalarFieldEnum[]
  }

  /**
   * RawMessage findFirstOrThrow
   */
  export type RawMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * Filter, which RawMessage to fetch.
     */
    where?: RawMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RawMessages to fetch.
     */
    orderBy?: RawMessageOrderByWithRelationInput | RawMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RawMessages.
     */
    cursor?: RawMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RawMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RawMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RawMessages.
     */
    distinct?: RawMessageScalarFieldEnum | RawMessageScalarFieldEnum[]
  }

  /**
   * RawMessage findMany
   */
  export type RawMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * Filter, which RawMessages to fetch.
     */
    where?: RawMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RawMessages to fetch.
     */
    orderBy?: RawMessageOrderByWithRelationInput | RawMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RawMessages.
     */
    cursor?: RawMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RawMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RawMessages.
     */
    skip?: number
    distinct?: RawMessageScalarFieldEnum | RawMessageScalarFieldEnum[]
  }

  /**
   * RawMessage create
   */
  export type RawMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a RawMessage.
     */
    data: XOR<RawMessageCreateInput, RawMessageUncheckedCreateInput>
  }

  /**
   * RawMessage createMany
   */
  export type RawMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RawMessages.
     */
    data: RawMessageCreateManyInput | RawMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RawMessage createManyAndReturn
   */
  export type RawMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * The data used to create many RawMessages.
     */
    data: RawMessageCreateManyInput | RawMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RawMessage update
   */
  export type RawMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a RawMessage.
     */
    data: XOR<RawMessageUpdateInput, RawMessageUncheckedUpdateInput>
    /**
     * Choose, which RawMessage to update.
     */
    where: RawMessageWhereUniqueInput
  }

  /**
   * RawMessage updateMany
   */
  export type RawMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RawMessages.
     */
    data: XOR<RawMessageUpdateManyMutationInput, RawMessageUncheckedUpdateManyInput>
    /**
     * Filter which RawMessages to update
     */
    where?: RawMessageWhereInput
    /**
     * Limit how many RawMessages to update.
     */
    limit?: number
  }

  /**
   * RawMessage updateManyAndReturn
   */
  export type RawMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * The data used to update RawMessages.
     */
    data: XOR<RawMessageUpdateManyMutationInput, RawMessageUncheckedUpdateManyInput>
    /**
     * Filter which RawMessages to update
     */
    where?: RawMessageWhereInput
    /**
     * Limit how many RawMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * RawMessage upsert
   */
  export type RawMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the RawMessage to update in case it exists.
     */
    where: RawMessageWhereUniqueInput
    /**
     * In case the RawMessage found by the `where` argument doesn't exist, create a new RawMessage with this data.
     */
    create: XOR<RawMessageCreateInput, RawMessageUncheckedCreateInput>
    /**
     * In case the RawMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RawMessageUpdateInput, RawMessageUncheckedUpdateInput>
  }

  /**
   * RawMessage delete
   */
  export type RawMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
    /**
     * Filter which RawMessage to delete.
     */
    where: RawMessageWhereUniqueInput
  }

  /**
   * RawMessage deleteMany
   */
  export type RawMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RawMessages to delete
     */
    where?: RawMessageWhereInput
    /**
     * Limit how many RawMessages to delete.
     */
    limit?: number
  }

  /**
   * RawMessage.transaction
   */
  export type RawMessage$transactionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
  }

  /**
   * RawMessage without action
   */
  export type RawMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RawMessage
     */
    select?: RawMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RawMessage
     */
    omit?: RawMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RawMessageInclude<ExtArgs> | null
  }


  /**
   * Model DeviceToken
   */

  export type AggregateDeviceToken = {
    _count: DeviceTokenCountAggregateOutputType | null
    _avg: DeviceTokenAvgAggregateOutputType | null
    _sum: DeviceTokenSumAggregateOutputType | null
    _min: DeviceTokenMinAggregateOutputType | null
    _max: DeviceTokenMaxAggregateOutputType | null
  }

  export type DeviceTokenAvgAggregateOutputType = {
    id: number | null
  }

  export type DeviceTokenSumAggregateOutputType = {
    id: number | null
  }

  export type DeviceTokenMinAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    label: string | null
    tokenHash: string | null
    tokenPrefix: string | null
    createdAt: Date | null
    lastUsedAt: Date | null
    revokedAt: Date | null
  }

  export type DeviceTokenMaxAggregateOutputType = {
    id: number | null
    uuid: string | null
    userUuid: string | null
    label: string | null
    tokenHash: string | null
    tokenPrefix: string | null
    createdAt: Date | null
    lastUsedAt: Date | null
    revokedAt: Date | null
  }

  export type DeviceTokenCountAggregateOutputType = {
    id: number
    uuid: number
    userUuid: number
    label: number
    tokenHash: number
    tokenPrefix: number
    createdAt: number
    lastUsedAt: number
    revokedAt: number
    _all: number
  }


  export type DeviceTokenAvgAggregateInputType = {
    id?: true
  }

  export type DeviceTokenSumAggregateInputType = {
    id?: true
  }

  export type DeviceTokenMinAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    label?: true
    tokenHash?: true
    tokenPrefix?: true
    createdAt?: true
    lastUsedAt?: true
    revokedAt?: true
  }

  export type DeviceTokenMaxAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    label?: true
    tokenHash?: true
    tokenPrefix?: true
    createdAt?: true
    lastUsedAt?: true
    revokedAt?: true
  }

  export type DeviceTokenCountAggregateInputType = {
    id?: true
    uuid?: true
    userUuid?: true
    label?: true
    tokenHash?: true
    tokenPrefix?: true
    createdAt?: true
    lastUsedAt?: true
    revokedAt?: true
    _all?: true
  }

  export type DeviceTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DeviceToken to aggregate.
     */
    where?: DeviceTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeviceTokens to fetch.
     */
    orderBy?: DeviceTokenOrderByWithRelationInput | DeviceTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DeviceTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeviceTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeviceTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DeviceTokens
    **/
    _count?: true | DeviceTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DeviceTokenAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DeviceTokenSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DeviceTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DeviceTokenMaxAggregateInputType
  }

  export type GetDeviceTokenAggregateType<T extends DeviceTokenAggregateArgs> = {
        [P in keyof T & keyof AggregateDeviceToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDeviceToken[P]>
      : GetScalarType<T[P], AggregateDeviceToken[P]>
  }




  export type DeviceTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DeviceTokenWhereInput
    orderBy?: DeviceTokenOrderByWithAggregationInput | DeviceTokenOrderByWithAggregationInput[]
    by: DeviceTokenScalarFieldEnum[] | DeviceTokenScalarFieldEnum
    having?: DeviceTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DeviceTokenCountAggregateInputType | true
    _avg?: DeviceTokenAvgAggregateInputType
    _sum?: DeviceTokenSumAggregateInputType
    _min?: DeviceTokenMinAggregateInputType
    _max?: DeviceTokenMaxAggregateInputType
  }

  export type DeviceTokenGroupByOutputType = {
    id: number
    uuid: string
    userUuid: string
    label: string | null
    tokenHash: string
    tokenPrefix: string
    createdAt: Date
    lastUsedAt: Date | null
    revokedAt: Date | null
    _count: DeviceTokenCountAggregateOutputType | null
    _avg: DeviceTokenAvgAggregateOutputType | null
    _sum: DeviceTokenSumAggregateOutputType | null
    _min: DeviceTokenMinAggregateOutputType | null
    _max: DeviceTokenMaxAggregateOutputType | null
  }

  type GetDeviceTokenGroupByPayload<T extends DeviceTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DeviceTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DeviceTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DeviceTokenGroupByOutputType[P]>
            : GetScalarType<T[P], DeviceTokenGroupByOutputType[P]>
        }
      >
    >


  export type DeviceTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    label?: boolean
    tokenHash?: boolean
    tokenPrefix?: boolean
    createdAt?: boolean
    lastUsedAt?: boolean
    revokedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["deviceToken"]>

  export type DeviceTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    label?: boolean
    tokenHash?: boolean
    tokenPrefix?: boolean
    createdAt?: boolean
    lastUsedAt?: boolean
    revokedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["deviceToken"]>

  export type DeviceTokenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    label?: boolean
    tokenHash?: boolean
    tokenPrefix?: boolean
    createdAt?: boolean
    lastUsedAt?: boolean
    revokedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["deviceToken"]>

  export type DeviceTokenSelectScalar = {
    id?: boolean
    uuid?: boolean
    userUuid?: boolean
    label?: boolean
    tokenHash?: boolean
    tokenPrefix?: boolean
    createdAt?: boolean
    lastUsedAt?: boolean
    revokedAt?: boolean
  }

  export type DeviceTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "uuid" | "userUuid" | "label" | "tokenHash" | "tokenPrefix" | "createdAt" | "lastUsedAt" | "revokedAt", ExtArgs["result"]["deviceToken"]>
  export type DeviceTokenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type DeviceTokenIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type DeviceTokenIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $DeviceTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DeviceToken"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      uuid: string
      userUuid: string
      label: string | null
      tokenHash: string
      tokenPrefix: string
      createdAt: Date
      lastUsedAt: Date | null
      revokedAt: Date | null
    }, ExtArgs["result"]["deviceToken"]>
    composites: {}
  }

  type DeviceTokenGetPayload<S extends boolean | null | undefined | DeviceTokenDefaultArgs> = $Result.GetResult<Prisma.$DeviceTokenPayload, S>

  type DeviceTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DeviceTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DeviceTokenCountAggregateInputType | true
    }

  export interface DeviceTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DeviceToken'], meta: { name: 'DeviceToken' } }
    /**
     * Find zero or one DeviceToken that matches the filter.
     * @param {DeviceTokenFindUniqueArgs} args - Arguments to find a DeviceToken
     * @example
     * // Get one DeviceToken
     * const deviceToken = await prisma.deviceToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DeviceTokenFindUniqueArgs>(args: SelectSubset<T, DeviceTokenFindUniqueArgs<ExtArgs>>): Prisma__DeviceTokenClient<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DeviceToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DeviceTokenFindUniqueOrThrowArgs} args - Arguments to find a DeviceToken
     * @example
     * // Get one DeviceToken
     * const deviceToken = await prisma.deviceToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DeviceTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, DeviceTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DeviceTokenClient<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DeviceToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceTokenFindFirstArgs} args - Arguments to find a DeviceToken
     * @example
     * // Get one DeviceToken
     * const deviceToken = await prisma.deviceToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DeviceTokenFindFirstArgs>(args?: SelectSubset<T, DeviceTokenFindFirstArgs<ExtArgs>>): Prisma__DeviceTokenClient<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DeviceToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceTokenFindFirstOrThrowArgs} args - Arguments to find a DeviceToken
     * @example
     * // Get one DeviceToken
     * const deviceToken = await prisma.deviceToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DeviceTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, DeviceTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__DeviceTokenClient<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DeviceTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DeviceTokens
     * const deviceTokens = await prisma.deviceToken.findMany()
     * 
     * // Get first 10 DeviceTokens
     * const deviceTokens = await prisma.deviceToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const deviceTokenWithIdOnly = await prisma.deviceToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DeviceTokenFindManyArgs>(args?: SelectSubset<T, DeviceTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DeviceToken.
     * @param {DeviceTokenCreateArgs} args - Arguments to create a DeviceToken.
     * @example
     * // Create one DeviceToken
     * const DeviceToken = await prisma.deviceToken.create({
     *   data: {
     *     // ... data to create a DeviceToken
     *   }
     * })
     * 
     */
    create<T extends DeviceTokenCreateArgs>(args: SelectSubset<T, DeviceTokenCreateArgs<ExtArgs>>): Prisma__DeviceTokenClient<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DeviceTokens.
     * @param {DeviceTokenCreateManyArgs} args - Arguments to create many DeviceTokens.
     * @example
     * // Create many DeviceTokens
     * const deviceToken = await prisma.deviceToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DeviceTokenCreateManyArgs>(args?: SelectSubset<T, DeviceTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DeviceTokens and returns the data saved in the database.
     * @param {DeviceTokenCreateManyAndReturnArgs} args - Arguments to create many DeviceTokens.
     * @example
     * // Create many DeviceTokens
     * const deviceToken = await prisma.deviceToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DeviceTokens and only return the `id`
     * const deviceTokenWithIdOnly = await prisma.deviceToken.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DeviceTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, DeviceTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DeviceToken.
     * @param {DeviceTokenDeleteArgs} args - Arguments to delete one DeviceToken.
     * @example
     * // Delete one DeviceToken
     * const DeviceToken = await prisma.deviceToken.delete({
     *   where: {
     *     // ... filter to delete one DeviceToken
     *   }
     * })
     * 
     */
    delete<T extends DeviceTokenDeleteArgs>(args: SelectSubset<T, DeviceTokenDeleteArgs<ExtArgs>>): Prisma__DeviceTokenClient<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DeviceToken.
     * @param {DeviceTokenUpdateArgs} args - Arguments to update one DeviceToken.
     * @example
     * // Update one DeviceToken
     * const deviceToken = await prisma.deviceToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DeviceTokenUpdateArgs>(args: SelectSubset<T, DeviceTokenUpdateArgs<ExtArgs>>): Prisma__DeviceTokenClient<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DeviceTokens.
     * @param {DeviceTokenDeleteManyArgs} args - Arguments to filter DeviceTokens to delete.
     * @example
     * // Delete a few DeviceTokens
     * const { count } = await prisma.deviceToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DeviceTokenDeleteManyArgs>(args?: SelectSubset<T, DeviceTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DeviceTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DeviceTokens
     * const deviceToken = await prisma.deviceToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DeviceTokenUpdateManyArgs>(args: SelectSubset<T, DeviceTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DeviceTokens and returns the data updated in the database.
     * @param {DeviceTokenUpdateManyAndReturnArgs} args - Arguments to update many DeviceTokens.
     * @example
     * // Update many DeviceTokens
     * const deviceToken = await prisma.deviceToken.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DeviceTokens and only return the `id`
     * const deviceTokenWithIdOnly = await prisma.deviceToken.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DeviceTokenUpdateManyAndReturnArgs>(args: SelectSubset<T, DeviceTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DeviceToken.
     * @param {DeviceTokenUpsertArgs} args - Arguments to update or create a DeviceToken.
     * @example
     * // Update or create a DeviceToken
     * const deviceToken = await prisma.deviceToken.upsert({
     *   create: {
     *     // ... data to create a DeviceToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DeviceToken we want to update
     *   }
     * })
     */
    upsert<T extends DeviceTokenUpsertArgs>(args: SelectSubset<T, DeviceTokenUpsertArgs<ExtArgs>>): Prisma__DeviceTokenClient<$Result.GetResult<Prisma.$DeviceTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DeviceTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceTokenCountArgs} args - Arguments to filter DeviceTokens to count.
     * @example
     * // Count the number of DeviceTokens
     * const count = await prisma.deviceToken.count({
     *   where: {
     *     // ... the filter for the DeviceTokens we want to count
     *   }
     * })
    **/
    count<T extends DeviceTokenCountArgs>(
      args?: Subset<T, DeviceTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DeviceTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DeviceToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DeviceTokenAggregateArgs>(args: Subset<T, DeviceTokenAggregateArgs>): Prisma.PrismaPromise<GetDeviceTokenAggregateType<T>>

    /**
     * Group by DeviceToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DeviceTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DeviceTokenGroupByArgs['orderBy'] }
        : { orderBy?: DeviceTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DeviceTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDeviceTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DeviceToken model
   */
  readonly fields: DeviceTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DeviceToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DeviceTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DeviceToken model
   */
  interface DeviceTokenFieldRefs {
    readonly id: FieldRef<"DeviceToken", 'Int'>
    readonly uuid: FieldRef<"DeviceToken", 'String'>
    readonly userUuid: FieldRef<"DeviceToken", 'String'>
    readonly label: FieldRef<"DeviceToken", 'String'>
    readonly tokenHash: FieldRef<"DeviceToken", 'String'>
    readonly tokenPrefix: FieldRef<"DeviceToken", 'String'>
    readonly createdAt: FieldRef<"DeviceToken", 'DateTime'>
    readonly lastUsedAt: FieldRef<"DeviceToken", 'DateTime'>
    readonly revokedAt: FieldRef<"DeviceToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DeviceToken findUnique
   */
  export type DeviceTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * Filter, which DeviceToken to fetch.
     */
    where: DeviceTokenWhereUniqueInput
  }

  /**
   * DeviceToken findUniqueOrThrow
   */
  export type DeviceTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * Filter, which DeviceToken to fetch.
     */
    where: DeviceTokenWhereUniqueInput
  }

  /**
   * DeviceToken findFirst
   */
  export type DeviceTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * Filter, which DeviceToken to fetch.
     */
    where?: DeviceTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeviceTokens to fetch.
     */
    orderBy?: DeviceTokenOrderByWithRelationInput | DeviceTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DeviceTokens.
     */
    cursor?: DeviceTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeviceTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeviceTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeviceTokens.
     */
    distinct?: DeviceTokenScalarFieldEnum | DeviceTokenScalarFieldEnum[]
  }

  /**
   * DeviceToken findFirstOrThrow
   */
  export type DeviceTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * Filter, which DeviceToken to fetch.
     */
    where?: DeviceTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeviceTokens to fetch.
     */
    orderBy?: DeviceTokenOrderByWithRelationInput | DeviceTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DeviceTokens.
     */
    cursor?: DeviceTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeviceTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeviceTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeviceTokens.
     */
    distinct?: DeviceTokenScalarFieldEnum | DeviceTokenScalarFieldEnum[]
  }

  /**
   * DeviceToken findMany
   */
  export type DeviceTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * Filter, which DeviceTokens to fetch.
     */
    where?: DeviceTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeviceTokens to fetch.
     */
    orderBy?: DeviceTokenOrderByWithRelationInput | DeviceTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DeviceTokens.
     */
    cursor?: DeviceTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeviceTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeviceTokens.
     */
    skip?: number
    distinct?: DeviceTokenScalarFieldEnum | DeviceTokenScalarFieldEnum[]
  }

  /**
   * DeviceToken create
   */
  export type DeviceTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * The data needed to create a DeviceToken.
     */
    data: XOR<DeviceTokenCreateInput, DeviceTokenUncheckedCreateInput>
  }

  /**
   * DeviceToken createMany
   */
  export type DeviceTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DeviceTokens.
     */
    data: DeviceTokenCreateManyInput | DeviceTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DeviceToken createManyAndReturn
   */
  export type DeviceTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * The data used to create many DeviceTokens.
     */
    data: DeviceTokenCreateManyInput | DeviceTokenCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * DeviceToken update
   */
  export type DeviceTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * The data needed to update a DeviceToken.
     */
    data: XOR<DeviceTokenUpdateInput, DeviceTokenUncheckedUpdateInput>
    /**
     * Choose, which DeviceToken to update.
     */
    where: DeviceTokenWhereUniqueInput
  }

  /**
   * DeviceToken updateMany
   */
  export type DeviceTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DeviceTokens.
     */
    data: XOR<DeviceTokenUpdateManyMutationInput, DeviceTokenUncheckedUpdateManyInput>
    /**
     * Filter which DeviceTokens to update
     */
    where?: DeviceTokenWhereInput
    /**
     * Limit how many DeviceTokens to update.
     */
    limit?: number
  }

  /**
   * DeviceToken updateManyAndReturn
   */
  export type DeviceTokenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * The data used to update DeviceTokens.
     */
    data: XOR<DeviceTokenUpdateManyMutationInput, DeviceTokenUncheckedUpdateManyInput>
    /**
     * Filter which DeviceTokens to update
     */
    where?: DeviceTokenWhereInput
    /**
     * Limit how many DeviceTokens to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * DeviceToken upsert
   */
  export type DeviceTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * The filter to search for the DeviceToken to update in case it exists.
     */
    where: DeviceTokenWhereUniqueInput
    /**
     * In case the DeviceToken found by the `where` argument doesn't exist, create a new DeviceToken with this data.
     */
    create: XOR<DeviceTokenCreateInput, DeviceTokenUncheckedCreateInput>
    /**
     * In case the DeviceToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DeviceTokenUpdateInput, DeviceTokenUncheckedUpdateInput>
  }

  /**
   * DeviceToken delete
   */
  export type DeviceTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
    /**
     * Filter which DeviceToken to delete.
     */
    where: DeviceTokenWhereUniqueInput
  }

  /**
   * DeviceToken deleteMany
   */
  export type DeviceTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DeviceTokens to delete
     */
    where?: DeviceTokenWhereInput
    /**
     * Limit how many DeviceTokens to delete.
     */
    limit?: number
  }

  /**
   * DeviceToken without action
   */
  export type DeviceTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeviceToken
     */
    select?: DeviceTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeviceToken
     */
    omit?: DeviceTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceTokenInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    uuid: 'uuid',
    id: 'id',
    email: 'email',
    name: 'name',
    image: 'image',
    provider: 'provider',
    subscription: 'subscription',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const CategoryScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    userUuid: 'userUuid',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum]


  export const SubcategoryScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    userUuid: 'userUuid',
    categoryId: 'categoryId',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SubcategoryScalarFieldEnum = (typeof SubcategoryScalarFieldEnum)[keyof typeof SubcategoryScalarFieldEnum]


  export const RecipientScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    userUuid: 'userUuid',
    displayName: 'displayName',
    normalizedName: 'normalizedName',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type RecipientScalarFieldEnum = (typeof RecipientScalarFieldEnum)[keyof typeof RecipientScalarFieldEnum]


  export const RecipientIdentifierScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    userUuid: 'userUuid',
    recipientId: 'recipientId',
    kind: 'kind',
    value: 'value',
    normalizedValue: 'normalizedValue',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type RecipientIdentifierScalarFieldEnum = (typeof RecipientIdentifierScalarFieldEnum)[keyof typeof RecipientIdentifierScalarFieldEnum]


  export const TransactionScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    userUuid: 'userUuid',
    recipientId: 'recipientId',
    categoryId: 'categoryId',
    subcategoryId: 'subcategoryId',
    amount: 'amount',
    currency: 'currency',
    type: 'type',
    source: 'source',
    recipientRaw: 'recipientRaw',
    recipientName: 'recipientName',
    reference: 'reference',
    accountLabel: 'accountLabel',
    remarks: 'remarks',
    locationRaw: 'locationRaw',
    timestamp: 'timestamp',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TransactionScalarFieldEnum = (typeof TransactionScalarFieldEnum)[keyof typeof TransactionScalarFieldEnum]


  export const RawMessageScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    userUuid: 'userUuid',
    transactionId: 'transactionId',
    body: 'body',
    source: 'source',
    parseStatus: 'parseStatus',
    parserName: 'parserName',
    failureReason: 'failureReason',
    parsedPayload: 'parsedPayload',
    locationRaw: 'locationRaw',
    receivedAt: 'receivedAt',
    createdAt: 'createdAt'
  };

  export type RawMessageScalarFieldEnum = (typeof RawMessageScalarFieldEnum)[keyof typeof RawMessageScalarFieldEnum]


  export const DeviceTokenScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    userUuid: 'userUuid',
    label: 'label',
    tokenHash: 'tokenHash',
    tokenPrefix: 'tokenPrefix',
    createdAt: 'createdAt',
    lastUsedAt: 'lastUsedAt',
    revokedAt: 'revokedAt'
  };

  export type DeviceTokenScalarFieldEnum = (typeof DeviceTokenScalarFieldEnum)[keyof typeof DeviceTokenScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'RecipientIdentifierKind'
   */
  export type EnumRecipientIdentifierKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RecipientIdentifierKind'>
    


  /**
   * Reference to a field of type 'RecipientIdentifierKind[]'
   */
  export type ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RecipientIdentifierKind[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'TransactionType'
   */
  export type EnumTransactionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionType'>
    


  /**
   * Reference to a field of type 'TransactionType[]'
   */
  export type ListEnumTransactionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionType[]'>
    


  /**
   * Reference to a field of type 'TransactionSource'
   */
  export type EnumTransactionSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionSource'>
    


  /**
   * Reference to a field of type 'TransactionSource[]'
   */
  export type ListEnumTransactionSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionSource[]'>
    


  /**
   * Reference to a field of type 'RawMessageSource'
   */
  export type EnumRawMessageSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RawMessageSource'>
    


  /**
   * Reference to a field of type 'RawMessageSource[]'
   */
  export type ListEnumRawMessageSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RawMessageSource[]'>
    


  /**
   * Reference to a field of type 'ParseStatus'
   */
  export type EnumParseStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ParseStatus'>
    


  /**
   * Reference to a field of type 'ParseStatus[]'
   */
  export type ListEnumParseStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ParseStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    uuid?: StringFilter<"User"> | string
    id?: IntFilter<"User"> | number
    email?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    image?: StringNullableFilter<"User"> | string | null
    provider?: StringFilter<"User"> | string
    subscription?: IntFilter<"User"> | number
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    categories?: CategoryListRelationFilter
    subcategories?: SubcategoryListRelationFilter
    recipients?: RecipientListRelationFilter
    transactions?: TransactionListRelationFilter
    rawMessages?: RawMessageListRelationFilter
    deviceTokens?: DeviceTokenListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    uuid?: SortOrder
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    image?: SortOrderInput | SortOrder
    provider?: SortOrder
    subscription?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    categories?: CategoryOrderByRelationAggregateInput
    subcategories?: SubcategoryOrderByRelationAggregateInput
    recipients?: RecipientOrderByRelationAggregateInput
    transactions?: TransactionOrderByRelationAggregateInput
    rawMessages?: RawMessageOrderByRelationAggregateInput
    deviceTokens?: DeviceTokenOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    uuid?: string
    id?: number
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    image?: StringNullableFilter<"User"> | string | null
    provider?: StringFilter<"User"> | string
    subscription?: IntFilter<"User"> | number
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    categories?: CategoryListRelationFilter
    subcategories?: SubcategoryListRelationFilter
    recipients?: RecipientListRelationFilter
    transactions?: TransactionListRelationFilter
    rawMessages?: RawMessageListRelationFilter
    deviceTokens?: DeviceTokenListRelationFilter
  }, "uuid" | "id" | "email">

  export type UserOrderByWithAggregationInput = {
    uuid?: SortOrder
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    image?: SortOrderInput | SortOrder
    provider?: SortOrder
    subscription?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    uuid?: StringWithAggregatesFilter<"User"> | string
    id?: IntWithAggregatesFilter<"User"> | number
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    image?: StringNullableWithAggregatesFilter<"User"> | string | null
    provider?: StringWithAggregatesFilter<"User"> | string
    subscription?: IntWithAggregatesFilter<"User"> | number
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type CategoryWhereInput = {
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    id?: IntFilter<"Category"> | number
    uuid?: StringFilter<"Category"> | string
    userUuid?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    subcategories?: SubcategoryListRelationFilter
    transactions?: TransactionListRelationFilter
  }

  export type CategoryOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    subcategories?: SubcategoryOrderByRelationAggregateInput
    transactions?: TransactionOrderByRelationAggregateInput
  }

  export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    uuid?: string
    userUuid_name?: CategoryUserUuidNameCompoundUniqueInput
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    userUuid?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    subcategories?: SubcategoryListRelationFilter
    transactions?: TransactionListRelationFilter
  }, "id" | "uuid" | "userUuid_name">

  export type CategoryOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CategoryCountOrderByAggregateInput
    _avg?: CategoryAvgOrderByAggregateInput
    _max?: CategoryMaxOrderByAggregateInput
    _min?: CategoryMinOrderByAggregateInput
    _sum?: CategorySumOrderByAggregateInput
  }

  export type CategoryScalarWhereWithAggregatesInput = {
    AND?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    OR?: CategoryScalarWhereWithAggregatesInput[]
    NOT?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Category"> | number
    uuid?: StringWithAggregatesFilter<"Category"> | string
    userUuid?: StringWithAggregatesFilter<"Category"> | string
    name?: StringWithAggregatesFilter<"Category"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
  }

  export type SubcategoryWhereInput = {
    AND?: SubcategoryWhereInput | SubcategoryWhereInput[]
    OR?: SubcategoryWhereInput[]
    NOT?: SubcategoryWhereInput | SubcategoryWhereInput[]
    id?: IntFilter<"Subcategory"> | number
    uuid?: StringFilter<"Subcategory"> | string
    userUuid?: StringFilter<"Subcategory"> | string
    categoryId?: IntFilter<"Subcategory"> | number
    name?: StringFilter<"Subcategory"> | string
    createdAt?: DateTimeFilter<"Subcategory"> | Date | string
    updatedAt?: DateTimeFilter<"Subcategory"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    category?: XOR<CategoryScalarRelationFilter, CategoryWhereInput>
    transactions?: TransactionListRelationFilter
  }

  export type SubcategoryOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    category?: CategoryOrderByWithRelationInput
    transactions?: TransactionOrderByRelationAggregateInput
  }

  export type SubcategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    uuid?: string
    categoryId_name?: SubcategoryCategoryIdNameCompoundUniqueInput
    AND?: SubcategoryWhereInput | SubcategoryWhereInput[]
    OR?: SubcategoryWhereInput[]
    NOT?: SubcategoryWhereInput | SubcategoryWhereInput[]
    userUuid?: StringFilter<"Subcategory"> | string
    categoryId?: IntFilter<"Subcategory"> | number
    name?: StringFilter<"Subcategory"> | string
    createdAt?: DateTimeFilter<"Subcategory"> | Date | string
    updatedAt?: DateTimeFilter<"Subcategory"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    category?: XOR<CategoryScalarRelationFilter, CategoryWhereInput>
    transactions?: TransactionListRelationFilter
  }, "id" | "uuid" | "categoryId_name">

  export type SubcategoryOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SubcategoryCountOrderByAggregateInput
    _avg?: SubcategoryAvgOrderByAggregateInput
    _max?: SubcategoryMaxOrderByAggregateInput
    _min?: SubcategoryMinOrderByAggregateInput
    _sum?: SubcategorySumOrderByAggregateInput
  }

  export type SubcategoryScalarWhereWithAggregatesInput = {
    AND?: SubcategoryScalarWhereWithAggregatesInput | SubcategoryScalarWhereWithAggregatesInput[]
    OR?: SubcategoryScalarWhereWithAggregatesInput[]
    NOT?: SubcategoryScalarWhereWithAggregatesInput | SubcategoryScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Subcategory"> | number
    uuid?: StringWithAggregatesFilter<"Subcategory"> | string
    userUuid?: StringWithAggregatesFilter<"Subcategory"> | string
    categoryId?: IntWithAggregatesFilter<"Subcategory"> | number
    name?: StringWithAggregatesFilter<"Subcategory"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Subcategory"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Subcategory"> | Date | string
  }

  export type RecipientWhereInput = {
    AND?: RecipientWhereInput | RecipientWhereInput[]
    OR?: RecipientWhereInput[]
    NOT?: RecipientWhereInput | RecipientWhereInput[]
    id?: IntFilter<"Recipient"> | number
    uuid?: StringFilter<"Recipient"> | string
    userUuid?: StringFilter<"Recipient"> | string
    displayName?: StringFilter<"Recipient"> | string
    normalizedName?: StringFilter<"Recipient"> | string
    createdAt?: DateTimeFilter<"Recipient"> | Date | string
    updatedAt?: DateTimeFilter<"Recipient"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    identifiers?: RecipientIdentifierListRelationFilter
    transactions?: TransactionListRelationFilter
  }

  export type RecipientOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    displayName?: SortOrder
    normalizedName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    identifiers?: RecipientIdentifierOrderByRelationAggregateInput
    transactions?: TransactionOrderByRelationAggregateInput
  }

  export type RecipientWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    uuid?: string
    userUuid_normalizedName?: RecipientUserUuidNormalizedNameCompoundUniqueInput
    AND?: RecipientWhereInput | RecipientWhereInput[]
    OR?: RecipientWhereInput[]
    NOT?: RecipientWhereInput | RecipientWhereInput[]
    userUuid?: StringFilter<"Recipient"> | string
    displayName?: StringFilter<"Recipient"> | string
    normalizedName?: StringFilter<"Recipient"> | string
    createdAt?: DateTimeFilter<"Recipient"> | Date | string
    updatedAt?: DateTimeFilter<"Recipient"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    identifiers?: RecipientIdentifierListRelationFilter
    transactions?: TransactionListRelationFilter
  }, "id" | "uuid" | "userUuid_normalizedName">

  export type RecipientOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    displayName?: SortOrder
    normalizedName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RecipientCountOrderByAggregateInput
    _avg?: RecipientAvgOrderByAggregateInput
    _max?: RecipientMaxOrderByAggregateInput
    _min?: RecipientMinOrderByAggregateInput
    _sum?: RecipientSumOrderByAggregateInput
  }

  export type RecipientScalarWhereWithAggregatesInput = {
    AND?: RecipientScalarWhereWithAggregatesInput | RecipientScalarWhereWithAggregatesInput[]
    OR?: RecipientScalarWhereWithAggregatesInput[]
    NOT?: RecipientScalarWhereWithAggregatesInput | RecipientScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Recipient"> | number
    uuid?: StringWithAggregatesFilter<"Recipient"> | string
    userUuid?: StringWithAggregatesFilter<"Recipient"> | string
    displayName?: StringWithAggregatesFilter<"Recipient"> | string
    normalizedName?: StringWithAggregatesFilter<"Recipient"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Recipient"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Recipient"> | Date | string
  }

  export type RecipientIdentifierWhereInput = {
    AND?: RecipientIdentifierWhereInput | RecipientIdentifierWhereInput[]
    OR?: RecipientIdentifierWhereInput[]
    NOT?: RecipientIdentifierWhereInput | RecipientIdentifierWhereInput[]
    id?: IntFilter<"RecipientIdentifier"> | number
    uuid?: StringFilter<"RecipientIdentifier"> | string
    userUuid?: StringFilter<"RecipientIdentifier"> | string
    recipientId?: IntFilter<"RecipientIdentifier"> | number
    kind?: EnumRecipientIdentifierKindFilter<"RecipientIdentifier"> | $Enums.RecipientIdentifierKind
    value?: StringFilter<"RecipientIdentifier"> | string
    normalizedValue?: StringFilter<"RecipientIdentifier"> | string
    createdAt?: DateTimeFilter<"RecipientIdentifier"> | Date | string
    updatedAt?: DateTimeFilter<"RecipientIdentifier"> | Date | string
    recipient?: XOR<RecipientScalarRelationFilter, RecipientWhereInput>
  }

  export type RecipientIdentifierOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    kind?: SortOrder
    value?: SortOrder
    normalizedValue?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    recipient?: RecipientOrderByWithRelationInput
  }

  export type RecipientIdentifierWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    uuid?: string
    userUuid_kind_normalizedValue?: RecipientIdentifierUserUuidKindNormalizedValueCompoundUniqueInput
    AND?: RecipientIdentifierWhereInput | RecipientIdentifierWhereInput[]
    OR?: RecipientIdentifierWhereInput[]
    NOT?: RecipientIdentifierWhereInput | RecipientIdentifierWhereInput[]
    userUuid?: StringFilter<"RecipientIdentifier"> | string
    recipientId?: IntFilter<"RecipientIdentifier"> | number
    kind?: EnumRecipientIdentifierKindFilter<"RecipientIdentifier"> | $Enums.RecipientIdentifierKind
    value?: StringFilter<"RecipientIdentifier"> | string
    normalizedValue?: StringFilter<"RecipientIdentifier"> | string
    createdAt?: DateTimeFilter<"RecipientIdentifier"> | Date | string
    updatedAt?: DateTimeFilter<"RecipientIdentifier"> | Date | string
    recipient?: XOR<RecipientScalarRelationFilter, RecipientWhereInput>
  }, "id" | "uuid" | "userUuid_kind_normalizedValue">

  export type RecipientIdentifierOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    kind?: SortOrder
    value?: SortOrder
    normalizedValue?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RecipientIdentifierCountOrderByAggregateInput
    _avg?: RecipientIdentifierAvgOrderByAggregateInput
    _max?: RecipientIdentifierMaxOrderByAggregateInput
    _min?: RecipientIdentifierMinOrderByAggregateInput
    _sum?: RecipientIdentifierSumOrderByAggregateInput
  }

  export type RecipientIdentifierScalarWhereWithAggregatesInput = {
    AND?: RecipientIdentifierScalarWhereWithAggregatesInput | RecipientIdentifierScalarWhereWithAggregatesInput[]
    OR?: RecipientIdentifierScalarWhereWithAggregatesInput[]
    NOT?: RecipientIdentifierScalarWhereWithAggregatesInput | RecipientIdentifierScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"RecipientIdentifier"> | number
    uuid?: StringWithAggregatesFilter<"RecipientIdentifier"> | string
    userUuid?: StringWithAggregatesFilter<"RecipientIdentifier"> | string
    recipientId?: IntWithAggregatesFilter<"RecipientIdentifier"> | number
    kind?: EnumRecipientIdentifierKindWithAggregatesFilter<"RecipientIdentifier"> | $Enums.RecipientIdentifierKind
    value?: StringWithAggregatesFilter<"RecipientIdentifier"> | string
    normalizedValue?: StringWithAggregatesFilter<"RecipientIdentifier"> | string
    createdAt?: DateTimeWithAggregatesFilter<"RecipientIdentifier"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"RecipientIdentifier"> | Date | string
  }

  export type TransactionWhereInput = {
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    id?: IntFilter<"Transaction"> | number
    uuid?: StringFilter<"Transaction"> | string
    userUuid?: StringFilter<"Transaction"> | string
    recipientId?: IntFilter<"Transaction"> | number
    categoryId?: IntNullableFilter<"Transaction"> | number | null
    subcategoryId?: IntNullableFilter<"Transaction"> | number | null
    amount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Transaction"> | string
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    source?: EnumTransactionSourceFilter<"Transaction"> | $Enums.TransactionSource
    recipientRaw?: StringFilter<"Transaction"> | string
    recipientName?: StringNullableFilter<"Transaction"> | string | null
    reference?: StringNullableFilter<"Transaction"> | string | null
    accountLabel?: StringNullableFilter<"Transaction"> | string | null
    remarks?: StringNullableFilter<"Transaction"> | string | null
    locationRaw?: StringNullableFilter<"Transaction"> | string | null
    timestamp?: DateTimeFilter<"Transaction"> | Date | string
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    updatedAt?: DateTimeFilter<"Transaction"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    recipient?: XOR<RecipientScalarRelationFilter, RecipientWhereInput>
    category?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    subcategory?: XOR<SubcategoryNullableScalarRelationFilter, SubcategoryWhereInput> | null
    rawMessages?: RawMessageListRelationFilter
  }

  export type TransactionOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    categoryId?: SortOrderInput | SortOrder
    subcategoryId?: SortOrderInput | SortOrder
    amount?: SortOrder
    currency?: SortOrder
    type?: SortOrder
    source?: SortOrder
    recipientRaw?: SortOrder
    recipientName?: SortOrderInput | SortOrder
    reference?: SortOrderInput | SortOrder
    accountLabel?: SortOrderInput | SortOrder
    remarks?: SortOrderInput | SortOrder
    locationRaw?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    recipient?: RecipientOrderByWithRelationInput
    category?: CategoryOrderByWithRelationInput
    subcategory?: SubcategoryOrderByWithRelationInput
    rawMessages?: RawMessageOrderByRelationAggregateInput
  }

  export type TransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    uuid?: string
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    userUuid?: StringFilter<"Transaction"> | string
    recipientId?: IntFilter<"Transaction"> | number
    categoryId?: IntNullableFilter<"Transaction"> | number | null
    subcategoryId?: IntNullableFilter<"Transaction"> | number | null
    amount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Transaction"> | string
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    source?: EnumTransactionSourceFilter<"Transaction"> | $Enums.TransactionSource
    recipientRaw?: StringFilter<"Transaction"> | string
    recipientName?: StringNullableFilter<"Transaction"> | string | null
    reference?: StringNullableFilter<"Transaction"> | string | null
    accountLabel?: StringNullableFilter<"Transaction"> | string | null
    remarks?: StringNullableFilter<"Transaction"> | string | null
    locationRaw?: StringNullableFilter<"Transaction"> | string | null
    timestamp?: DateTimeFilter<"Transaction"> | Date | string
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    updatedAt?: DateTimeFilter<"Transaction"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    recipient?: XOR<RecipientScalarRelationFilter, RecipientWhereInput>
    category?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    subcategory?: XOR<SubcategoryNullableScalarRelationFilter, SubcategoryWhereInput> | null
    rawMessages?: RawMessageListRelationFilter
  }, "id" | "uuid">

  export type TransactionOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    categoryId?: SortOrderInput | SortOrder
    subcategoryId?: SortOrderInput | SortOrder
    amount?: SortOrder
    currency?: SortOrder
    type?: SortOrder
    source?: SortOrder
    recipientRaw?: SortOrder
    recipientName?: SortOrderInput | SortOrder
    reference?: SortOrderInput | SortOrder
    accountLabel?: SortOrderInput | SortOrder
    remarks?: SortOrderInput | SortOrder
    locationRaw?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TransactionCountOrderByAggregateInput
    _avg?: TransactionAvgOrderByAggregateInput
    _max?: TransactionMaxOrderByAggregateInput
    _min?: TransactionMinOrderByAggregateInput
    _sum?: TransactionSumOrderByAggregateInput
  }

  export type TransactionScalarWhereWithAggregatesInput = {
    AND?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    OR?: TransactionScalarWhereWithAggregatesInput[]
    NOT?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Transaction"> | number
    uuid?: StringWithAggregatesFilter<"Transaction"> | string
    userUuid?: StringWithAggregatesFilter<"Transaction"> | string
    recipientId?: IntWithAggregatesFilter<"Transaction"> | number
    categoryId?: IntNullableWithAggregatesFilter<"Transaction"> | number | null
    subcategoryId?: IntNullableWithAggregatesFilter<"Transaction"> | number | null
    amount?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    currency?: StringWithAggregatesFilter<"Transaction"> | string
    type?: EnumTransactionTypeWithAggregatesFilter<"Transaction"> | $Enums.TransactionType
    source?: EnumTransactionSourceWithAggregatesFilter<"Transaction"> | $Enums.TransactionSource
    recipientRaw?: StringWithAggregatesFilter<"Transaction"> | string
    recipientName?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    reference?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    accountLabel?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    remarks?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    locationRaw?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    timestamp?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
  }

  export type RawMessageWhereInput = {
    AND?: RawMessageWhereInput | RawMessageWhereInput[]
    OR?: RawMessageWhereInput[]
    NOT?: RawMessageWhereInput | RawMessageWhereInput[]
    id?: IntFilter<"RawMessage"> | number
    uuid?: StringFilter<"RawMessage"> | string
    userUuid?: StringFilter<"RawMessage"> | string
    transactionId?: IntNullableFilter<"RawMessage"> | number | null
    body?: StringFilter<"RawMessage"> | string
    source?: EnumRawMessageSourceFilter<"RawMessage"> | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFilter<"RawMessage"> | $Enums.ParseStatus
    parserName?: StringNullableFilter<"RawMessage"> | string | null
    failureReason?: StringNullableFilter<"RawMessage"> | string | null
    parsedPayload?: JsonNullableFilter<"RawMessage">
    locationRaw?: StringNullableFilter<"RawMessage"> | string | null
    receivedAt?: DateTimeFilter<"RawMessage"> | Date | string
    createdAt?: DateTimeFilter<"RawMessage"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    transaction?: XOR<TransactionNullableScalarRelationFilter, TransactionWhereInput> | null
  }

  export type RawMessageOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    transactionId?: SortOrderInput | SortOrder
    body?: SortOrder
    source?: SortOrder
    parseStatus?: SortOrder
    parserName?: SortOrderInput | SortOrder
    failureReason?: SortOrderInput | SortOrder
    parsedPayload?: SortOrderInput | SortOrder
    locationRaw?: SortOrderInput | SortOrder
    receivedAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    transaction?: TransactionOrderByWithRelationInput
  }

  export type RawMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    uuid?: string
    AND?: RawMessageWhereInput | RawMessageWhereInput[]
    OR?: RawMessageWhereInput[]
    NOT?: RawMessageWhereInput | RawMessageWhereInput[]
    userUuid?: StringFilter<"RawMessage"> | string
    transactionId?: IntNullableFilter<"RawMessage"> | number | null
    body?: StringFilter<"RawMessage"> | string
    source?: EnumRawMessageSourceFilter<"RawMessage"> | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFilter<"RawMessage"> | $Enums.ParseStatus
    parserName?: StringNullableFilter<"RawMessage"> | string | null
    failureReason?: StringNullableFilter<"RawMessage"> | string | null
    parsedPayload?: JsonNullableFilter<"RawMessage">
    locationRaw?: StringNullableFilter<"RawMessage"> | string | null
    receivedAt?: DateTimeFilter<"RawMessage"> | Date | string
    createdAt?: DateTimeFilter<"RawMessage"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    transaction?: XOR<TransactionNullableScalarRelationFilter, TransactionWhereInput> | null
  }, "id" | "uuid">

  export type RawMessageOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    transactionId?: SortOrderInput | SortOrder
    body?: SortOrder
    source?: SortOrder
    parseStatus?: SortOrder
    parserName?: SortOrderInput | SortOrder
    failureReason?: SortOrderInput | SortOrder
    parsedPayload?: SortOrderInput | SortOrder
    locationRaw?: SortOrderInput | SortOrder
    receivedAt?: SortOrder
    createdAt?: SortOrder
    _count?: RawMessageCountOrderByAggregateInput
    _avg?: RawMessageAvgOrderByAggregateInput
    _max?: RawMessageMaxOrderByAggregateInput
    _min?: RawMessageMinOrderByAggregateInput
    _sum?: RawMessageSumOrderByAggregateInput
  }

  export type RawMessageScalarWhereWithAggregatesInput = {
    AND?: RawMessageScalarWhereWithAggregatesInput | RawMessageScalarWhereWithAggregatesInput[]
    OR?: RawMessageScalarWhereWithAggregatesInput[]
    NOT?: RawMessageScalarWhereWithAggregatesInput | RawMessageScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"RawMessage"> | number
    uuid?: StringWithAggregatesFilter<"RawMessage"> | string
    userUuid?: StringWithAggregatesFilter<"RawMessage"> | string
    transactionId?: IntNullableWithAggregatesFilter<"RawMessage"> | number | null
    body?: StringWithAggregatesFilter<"RawMessage"> | string
    source?: EnumRawMessageSourceWithAggregatesFilter<"RawMessage"> | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusWithAggregatesFilter<"RawMessage"> | $Enums.ParseStatus
    parserName?: StringNullableWithAggregatesFilter<"RawMessage"> | string | null
    failureReason?: StringNullableWithAggregatesFilter<"RawMessage"> | string | null
    parsedPayload?: JsonNullableWithAggregatesFilter<"RawMessage">
    locationRaw?: StringNullableWithAggregatesFilter<"RawMessage"> | string | null
    receivedAt?: DateTimeWithAggregatesFilter<"RawMessage"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"RawMessage"> | Date | string
  }

  export type DeviceTokenWhereInput = {
    AND?: DeviceTokenWhereInput | DeviceTokenWhereInput[]
    OR?: DeviceTokenWhereInput[]
    NOT?: DeviceTokenWhereInput | DeviceTokenWhereInput[]
    id?: IntFilter<"DeviceToken"> | number
    uuid?: StringFilter<"DeviceToken"> | string
    userUuid?: StringFilter<"DeviceToken"> | string
    label?: StringNullableFilter<"DeviceToken"> | string | null
    tokenHash?: StringFilter<"DeviceToken"> | string
    tokenPrefix?: StringFilter<"DeviceToken"> | string
    createdAt?: DateTimeFilter<"DeviceToken"> | Date | string
    lastUsedAt?: DateTimeNullableFilter<"DeviceToken"> | Date | string | null
    revokedAt?: DateTimeNullableFilter<"DeviceToken"> | Date | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type DeviceTokenOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    label?: SortOrderInput | SortOrder
    tokenHash?: SortOrder
    tokenPrefix?: SortOrder
    createdAt?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    revokedAt?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type DeviceTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    uuid?: string
    tokenHash?: string
    AND?: DeviceTokenWhereInput | DeviceTokenWhereInput[]
    OR?: DeviceTokenWhereInput[]
    NOT?: DeviceTokenWhereInput | DeviceTokenWhereInput[]
    userUuid?: StringFilter<"DeviceToken"> | string
    label?: StringNullableFilter<"DeviceToken"> | string | null
    tokenPrefix?: StringFilter<"DeviceToken"> | string
    createdAt?: DateTimeFilter<"DeviceToken"> | Date | string
    lastUsedAt?: DateTimeNullableFilter<"DeviceToken"> | Date | string | null
    revokedAt?: DateTimeNullableFilter<"DeviceToken"> | Date | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "uuid" | "tokenHash">

  export type DeviceTokenOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    label?: SortOrderInput | SortOrder
    tokenHash?: SortOrder
    tokenPrefix?: SortOrder
    createdAt?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    revokedAt?: SortOrderInput | SortOrder
    _count?: DeviceTokenCountOrderByAggregateInput
    _avg?: DeviceTokenAvgOrderByAggregateInput
    _max?: DeviceTokenMaxOrderByAggregateInput
    _min?: DeviceTokenMinOrderByAggregateInput
    _sum?: DeviceTokenSumOrderByAggregateInput
  }

  export type DeviceTokenScalarWhereWithAggregatesInput = {
    AND?: DeviceTokenScalarWhereWithAggregatesInput | DeviceTokenScalarWhereWithAggregatesInput[]
    OR?: DeviceTokenScalarWhereWithAggregatesInput[]
    NOT?: DeviceTokenScalarWhereWithAggregatesInput | DeviceTokenScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"DeviceToken"> | number
    uuid?: StringWithAggregatesFilter<"DeviceToken"> | string
    userUuid?: StringWithAggregatesFilter<"DeviceToken"> | string
    label?: StringNullableWithAggregatesFilter<"DeviceToken"> | string | null
    tokenHash?: StringWithAggregatesFilter<"DeviceToken"> | string
    tokenPrefix?: StringWithAggregatesFilter<"DeviceToken"> | string
    createdAt?: DateTimeWithAggregatesFilter<"DeviceToken"> | Date | string
    lastUsedAt?: DateTimeNullableWithAggregatesFilter<"DeviceToken"> | Date | string | null
    revokedAt?: DateTimeNullableWithAggregatesFilter<"DeviceToken"> | Date | string | null
  }

  export type UserCreateInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryCreateNestedManyWithoutUserInput
    recipients?: RecipientCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryUncheckedCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutUserInput
    recipients?: RecipientUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUpdateManyWithoutUserNestedInput
    recipients?: RecipientUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUncheckedUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUncheckedUpdateManyWithoutUserNestedInput
    recipients?: RecipientUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUncheckedUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryCreateInput = {
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCategoriesInput
    subcategories?: SubcategoryCreateNestedManyWithoutCategoryInput
    transactions?: TransactionCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateInput = {
    id?: number
    uuid?: string
    userUuid: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutCategoryInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCategoriesNestedInput
    subcategories?: SubcategoryUpdateManyWithoutCategoryNestedInput
    transactions?: TransactionUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUncheckedUpdateManyWithoutCategoryNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryCreateManyInput = {
    id?: number
    uuid?: string
    userUuid: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryUpdateManyMutationInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryCreateInput = {
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSubcategoriesInput
    category: CategoryCreateNestedOneWithoutSubcategoriesInput
    transactions?: TransactionCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryUncheckedCreateInput = {
    id?: number
    uuid?: string
    userUuid: string
    categoryId: number
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSubcategoriesNestedInput
    category?: CategoryUpdateOneRequiredWithoutSubcategoriesNestedInput
    transactions?: TransactionUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    categoryId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryCreateManyInput = {
    id?: number
    uuid?: string
    userUuid: string
    categoryId: number
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubcategoryUpdateManyMutationInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    categoryId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientCreateInput = {
    uuid?: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutRecipientsInput
    identifiers?: RecipientIdentifierCreateNestedManyWithoutRecipientInput
    transactions?: TransactionCreateNestedManyWithoutRecipientInput
  }

  export type RecipientUncheckedCreateInput = {
    id?: number
    uuid?: string
    userUuid: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
    identifiers?: RecipientIdentifierUncheckedCreateNestedManyWithoutRecipientInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
  }

  export type RecipientUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRecipientsNestedInput
    identifiers?: RecipientIdentifierUpdateManyWithoutRecipientNestedInput
    transactions?: TransactionUpdateManyWithoutRecipientNestedInput
  }

  export type RecipientUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    identifiers?: RecipientIdentifierUncheckedUpdateManyWithoutRecipientNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
  }

  export type RecipientCreateManyInput = {
    id?: number
    uuid?: string
    userUuid: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecipientUpdateManyMutationInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientIdentifierCreateInput = {
    uuid?: string
    userUuid: string
    kind: $Enums.RecipientIdentifierKind
    value: string
    normalizedValue: string
    createdAt?: Date | string
    updatedAt?: Date | string
    recipient: RecipientCreateNestedOneWithoutIdentifiersInput
  }

  export type RecipientIdentifierUncheckedCreateInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    kind: $Enums.RecipientIdentifierKind
    value: string
    normalizedValue: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecipientIdentifierUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    kind?: EnumRecipientIdentifierKindFieldUpdateOperationsInput | $Enums.RecipientIdentifierKind
    value?: StringFieldUpdateOperationsInput | string
    normalizedValue?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recipient?: RecipientUpdateOneRequiredWithoutIdentifiersNestedInput
  }

  export type RecipientIdentifierUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    kind?: EnumRecipientIdentifierKindFieldUpdateOperationsInput | $Enums.RecipientIdentifierKind
    value?: StringFieldUpdateOperationsInput | string
    normalizedValue?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientIdentifierCreateManyInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    kind: $Enums.RecipientIdentifierKind
    value: string
    normalizedValue: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecipientIdentifierUpdateManyMutationInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    kind?: EnumRecipientIdentifierKindFieldUpdateOperationsInput | $Enums.RecipientIdentifierKind
    value?: StringFieldUpdateOperationsInput | string
    normalizedValue?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientIdentifierUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    kind?: EnumRecipientIdentifierKindFieldUpdateOperationsInput | $Enums.RecipientIdentifierKind
    value?: StringFieldUpdateOperationsInput | string
    normalizedValue?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateInput = {
    uuid?: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutTransactionsInput
    recipient: RecipientCreateNestedOneWithoutTransactionsInput
    category?: CategoryCreateNestedOneWithoutTransactionsInput
    subcategory?: SubcategoryCreateNestedOneWithoutTransactionsInput
    rawMessages?: RawMessageCreateNestedManyWithoutTransactionInput
  }

  export type TransactionUncheckedCreateInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    categoryId?: number | null
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutTransactionInput
  }

  export type TransactionUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTransactionsNestedInput
    recipient?: RecipientUpdateOneRequiredWithoutTransactionsNestedInput
    category?: CategoryUpdateOneWithoutTransactionsNestedInput
    subcategory?: SubcategoryUpdateOneWithoutTransactionsNestedInput
    rawMessages?: RawMessageUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawMessages?: RawMessageUncheckedUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionCreateManyInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    categoryId?: number | null
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionUpdateManyMutationInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RawMessageCreateInput = {
    uuid?: string
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutRawMessagesInput
    transaction?: TransactionCreateNestedOneWithoutRawMessagesInput
  }

  export type RawMessageUncheckedCreateInput = {
    id?: number
    uuid?: string
    userUuid: string
    transactionId?: number | null
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
  }

  export type RawMessageUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRawMessagesNestedInput
    transaction?: TransactionUpdateOneWithoutRawMessagesNestedInput
  }

  export type RawMessageUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    transactionId?: NullableIntFieldUpdateOperationsInput | number | null
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RawMessageCreateManyInput = {
    id?: number
    uuid?: string
    userUuid: string
    transactionId?: number | null
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
  }

  export type RawMessageUpdateManyMutationInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RawMessageUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    transactionId?: NullableIntFieldUpdateOperationsInput | number | null
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeviceTokenCreateInput = {
    uuid?: string
    label?: string | null
    tokenHash: string
    tokenPrefix: string
    createdAt?: Date | string
    lastUsedAt?: Date | string | null
    revokedAt?: Date | string | null
    user: UserCreateNestedOneWithoutDeviceTokensInput
  }

  export type DeviceTokenUncheckedCreateInput = {
    id?: number
    uuid?: string
    userUuid: string
    label?: string | null
    tokenHash: string
    tokenPrefix: string
    createdAt?: Date | string
    lastUsedAt?: Date | string | null
    revokedAt?: Date | string | null
  }

  export type DeviceTokenUpdateInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    label?: NullableStringFieldUpdateOperationsInput | string | null
    tokenHash?: StringFieldUpdateOperationsInput | string
    tokenPrefix?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutDeviceTokensNestedInput
  }

  export type DeviceTokenUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    label?: NullableStringFieldUpdateOperationsInput | string | null
    tokenHash?: StringFieldUpdateOperationsInput | string
    tokenPrefix?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type DeviceTokenCreateManyInput = {
    id?: number
    uuid?: string
    userUuid: string
    label?: string | null
    tokenHash: string
    tokenPrefix: string
    createdAt?: Date | string
    lastUsedAt?: Date | string | null
    revokedAt?: Date | string | null
  }

  export type DeviceTokenUpdateManyMutationInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    label?: NullableStringFieldUpdateOperationsInput | string | null
    tokenHash?: StringFieldUpdateOperationsInput | string
    tokenPrefix?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type DeviceTokenUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    label?: NullableStringFieldUpdateOperationsInput | string | null
    tokenHash?: StringFieldUpdateOperationsInput | string
    tokenPrefix?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CategoryListRelationFilter = {
    every?: CategoryWhereInput
    some?: CategoryWhereInput
    none?: CategoryWhereInput
  }

  export type SubcategoryListRelationFilter = {
    every?: SubcategoryWhereInput
    some?: SubcategoryWhereInput
    none?: SubcategoryWhereInput
  }

  export type RecipientListRelationFilter = {
    every?: RecipientWhereInput
    some?: RecipientWhereInput
    none?: RecipientWhereInput
  }

  export type TransactionListRelationFilter = {
    every?: TransactionWhereInput
    some?: TransactionWhereInput
    none?: TransactionWhereInput
  }

  export type RawMessageListRelationFilter = {
    every?: RawMessageWhereInput
    some?: RawMessageWhereInput
    none?: RawMessageWhereInput
  }

  export type DeviceTokenListRelationFilter = {
    every?: DeviceTokenWhereInput
    some?: DeviceTokenWhereInput
    none?: DeviceTokenWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CategoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SubcategoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RecipientOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RawMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DeviceTokenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    uuid?: SortOrder
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    image?: SortOrder
    provider?: SortOrder
    subscription?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
    subscription?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    uuid?: SortOrder
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    image?: SortOrder
    provider?: SortOrder
    subscription?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    uuid?: SortOrder
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    image?: SortOrder
    provider?: SortOrder
    subscription?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
    subscription?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type CategoryUserUuidNameCompoundUniqueInput = {
    userUuid: string
    name: string
  }

  export type CategoryCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type CategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategorySumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type CategoryScalarRelationFilter = {
    is?: CategoryWhereInput
    isNot?: CategoryWhereInput
  }

  export type SubcategoryCategoryIdNameCompoundUniqueInput = {
    categoryId: number
    name: string
  }

  export type SubcategoryCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubcategoryAvgOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
  }

  export type SubcategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubcategoryMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubcategorySumOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
  }

  export type RecipientIdentifierListRelationFilter = {
    every?: RecipientIdentifierWhereInput
    some?: RecipientIdentifierWhereInput
    none?: RecipientIdentifierWhereInput
  }

  export type RecipientIdentifierOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RecipientUserUuidNormalizedNameCompoundUniqueInput = {
    userUuid: string
    normalizedName: string
  }

  export type RecipientCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    displayName?: SortOrder
    normalizedName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecipientAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type RecipientMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    displayName?: SortOrder
    normalizedName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecipientMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    displayName?: SortOrder
    normalizedName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecipientSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type EnumRecipientIdentifierKindFilter<$PrismaModel = never> = {
    equals?: $Enums.RecipientIdentifierKind | EnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    in?: $Enums.RecipientIdentifierKind[] | ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.RecipientIdentifierKind[] | ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    not?: NestedEnumRecipientIdentifierKindFilter<$PrismaModel> | $Enums.RecipientIdentifierKind
  }

  export type RecipientScalarRelationFilter = {
    is?: RecipientWhereInput
    isNot?: RecipientWhereInput
  }

  export type RecipientIdentifierUserUuidKindNormalizedValueCompoundUniqueInput = {
    userUuid: string
    kind: $Enums.RecipientIdentifierKind
    normalizedValue: string
  }

  export type RecipientIdentifierCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    kind?: SortOrder
    value?: SortOrder
    normalizedValue?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecipientIdentifierAvgOrderByAggregateInput = {
    id?: SortOrder
    recipientId?: SortOrder
  }

  export type RecipientIdentifierMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    kind?: SortOrder
    value?: SortOrder
    normalizedValue?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecipientIdentifierMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    kind?: SortOrder
    value?: SortOrder
    normalizedValue?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecipientIdentifierSumOrderByAggregateInput = {
    id?: SortOrder
    recipientId?: SortOrder
  }

  export type EnumRecipientIdentifierKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RecipientIdentifierKind | EnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    in?: $Enums.RecipientIdentifierKind[] | ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.RecipientIdentifierKind[] | ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    not?: NestedEnumRecipientIdentifierKindWithAggregatesFilter<$PrismaModel> | $Enums.RecipientIdentifierKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRecipientIdentifierKindFilter<$PrismaModel>
    _max?: NestedEnumRecipientIdentifierKindFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type EnumTransactionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeFilter<$PrismaModel> | $Enums.TransactionType
  }

  export type EnumTransactionSourceFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionSource | EnumTransactionSourceFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionSource[] | ListEnumTransactionSourceFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionSource[] | ListEnumTransactionSourceFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionSourceFilter<$PrismaModel> | $Enums.TransactionSource
  }

  export type CategoryNullableScalarRelationFilter = {
    is?: CategoryWhereInput | null
    isNot?: CategoryWhereInput | null
  }

  export type SubcategoryNullableScalarRelationFilter = {
    is?: SubcategoryWhereInput | null
    isNot?: SubcategoryWhereInput | null
  }

  export type TransactionCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    categoryId?: SortOrder
    subcategoryId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    type?: SortOrder
    source?: SortOrder
    recipientRaw?: SortOrder
    recipientName?: SortOrder
    reference?: SortOrder
    accountLabel?: SortOrder
    remarks?: SortOrder
    locationRaw?: SortOrder
    timestamp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TransactionAvgOrderByAggregateInput = {
    id?: SortOrder
    recipientId?: SortOrder
    categoryId?: SortOrder
    subcategoryId?: SortOrder
    amount?: SortOrder
  }

  export type TransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    categoryId?: SortOrder
    subcategoryId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    type?: SortOrder
    source?: SortOrder
    recipientRaw?: SortOrder
    recipientName?: SortOrder
    reference?: SortOrder
    accountLabel?: SortOrder
    remarks?: SortOrder
    locationRaw?: SortOrder
    timestamp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TransactionMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    recipientId?: SortOrder
    categoryId?: SortOrder
    subcategoryId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    type?: SortOrder
    source?: SortOrder
    recipientRaw?: SortOrder
    recipientName?: SortOrder
    reference?: SortOrder
    accountLabel?: SortOrder
    remarks?: SortOrder
    locationRaw?: SortOrder
    timestamp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TransactionSumOrderByAggregateInput = {
    id?: SortOrder
    recipientId?: SortOrder
    categoryId?: SortOrder
    subcategoryId?: SortOrder
    amount?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type EnumTransactionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransactionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionTypeFilter<$PrismaModel>
    _max?: NestedEnumTransactionTypeFilter<$PrismaModel>
  }

  export type EnumTransactionSourceWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionSource | EnumTransactionSourceFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionSource[] | ListEnumTransactionSourceFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionSource[] | ListEnumTransactionSourceFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionSourceWithAggregatesFilter<$PrismaModel> | $Enums.TransactionSource
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionSourceFilter<$PrismaModel>
    _max?: NestedEnumTransactionSourceFilter<$PrismaModel>
  }

  export type EnumRawMessageSourceFilter<$PrismaModel = never> = {
    equals?: $Enums.RawMessageSource | EnumRawMessageSourceFieldRefInput<$PrismaModel>
    in?: $Enums.RawMessageSource[] | ListEnumRawMessageSourceFieldRefInput<$PrismaModel>
    notIn?: $Enums.RawMessageSource[] | ListEnumRawMessageSourceFieldRefInput<$PrismaModel>
    not?: NestedEnumRawMessageSourceFilter<$PrismaModel> | $Enums.RawMessageSource
  }

  export type EnumParseStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ParseStatus | EnumParseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ParseStatus[] | ListEnumParseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ParseStatus[] | ListEnumParseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumParseStatusFilter<$PrismaModel> | $Enums.ParseStatus
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type TransactionNullableScalarRelationFilter = {
    is?: TransactionWhereInput | null
    isNot?: TransactionWhereInput | null
  }

  export type RawMessageCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    transactionId?: SortOrder
    body?: SortOrder
    source?: SortOrder
    parseStatus?: SortOrder
    parserName?: SortOrder
    failureReason?: SortOrder
    parsedPayload?: SortOrder
    locationRaw?: SortOrder
    receivedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RawMessageAvgOrderByAggregateInput = {
    id?: SortOrder
    transactionId?: SortOrder
  }

  export type RawMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    transactionId?: SortOrder
    body?: SortOrder
    source?: SortOrder
    parseStatus?: SortOrder
    parserName?: SortOrder
    failureReason?: SortOrder
    locationRaw?: SortOrder
    receivedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RawMessageMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    transactionId?: SortOrder
    body?: SortOrder
    source?: SortOrder
    parseStatus?: SortOrder
    parserName?: SortOrder
    failureReason?: SortOrder
    locationRaw?: SortOrder
    receivedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RawMessageSumOrderByAggregateInput = {
    id?: SortOrder
    transactionId?: SortOrder
  }

  export type EnumRawMessageSourceWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RawMessageSource | EnumRawMessageSourceFieldRefInput<$PrismaModel>
    in?: $Enums.RawMessageSource[] | ListEnumRawMessageSourceFieldRefInput<$PrismaModel>
    notIn?: $Enums.RawMessageSource[] | ListEnumRawMessageSourceFieldRefInput<$PrismaModel>
    not?: NestedEnumRawMessageSourceWithAggregatesFilter<$PrismaModel> | $Enums.RawMessageSource
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRawMessageSourceFilter<$PrismaModel>
    _max?: NestedEnumRawMessageSourceFilter<$PrismaModel>
  }

  export type EnumParseStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ParseStatus | EnumParseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ParseStatus[] | ListEnumParseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ParseStatus[] | ListEnumParseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumParseStatusWithAggregatesFilter<$PrismaModel> | $Enums.ParseStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumParseStatusFilter<$PrismaModel>
    _max?: NestedEnumParseStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DeviceTokenCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    label?: SortOrder
    tokenHash?: SortOrder
    tokenPrefix?: SortOrder
    createdAt?: SortOrder
    lastUsedAt?: SortOrder
    revokedAt?: SortOrder
  }

  export type DeviceTokenAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DeviceTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    label?: SortOrder
    tokenHash?: SortOrder
    tokenPrefix?: SortOrder
    createdAt?: SortOrder
    lastUsedAt?: SortOrder
    revokedAt?: SortOrder
  }

  export type DeviceTokenMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    userUuid?: SortOrder
    label?: SortOrder
    tokenHash?: SortOrder
    tokenPrefix?: SortOrder
    createdAt?: SortOrder
    lastUsedAt?: SortOrder
    revokedAt?: SortOrder
  }

  export type DeviceTokenSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type CategoryCreateNestedManyWithoutUserInput = {
    create?: XOR<CategoryCreateWithoutUserInput, CategoryUncheckedCreateWithoutUserInput> | CategoryCreateWithoutUserInput[] | CategoryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutUserInput | CategoryCreateOrConnectWithoutUserInput[]
    createMany?: CategoryCreateManyUserInputEnvelope
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
  }

  export type SubcategoryCreateNestedManyWithoutUserInput = {
    create?: XOR<SubcategoryCreateWithoutUserInput, SubcategoryUncheckedCreateWithoutUserInput> | SubcategoryCreateWithoutUserInput[] | SubcategoryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutUserInput | SubcategoryCreateOrConnectWithoutUserInput[]
    createMany?: SubcategoryCreateManyUserInputEnvelope
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
  }

  export type RecipientCreateNestedManyWithoutUserInput = {
    create?: XOR<RecipientCreateWithoutUserInput, RecipientUncheckedCreateWithoutUserInput> | RecipientCreateWithoutUserInput[] | RecipientUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecipientCreateOrConnectWithoutUserInput | RecipientCreateOrConnectWithoutUserInput[]
    createMany?: RecipientCreateManyUserInputEnvelope
    connect?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
  }

  export type TransactionCreateNestedManyWithoutUserInput = {
    create?: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput> | TransactionCreateWithoutUserInput[] | TransactionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutUserInput | TransactionCreateOrConnectWithoutUserInput[]
    createMany?: TransactionCreateManyUserInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type RawMessageCreateNestedManyWithoutUserInput = {
    create?: XOR<RawMessageCreateWithoutUserInput, RawMessageUncheckedCreateWithoutUserInput> | RawMessageCreateWithoutUserInput[] | RawMessageUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RawMessageCreateOrConnectWithoutUserInput | RawMessageCreateOrConnectWithoutUserInput[]
    createMany?: RawMessageCreateManyUserInputEnvelope
    connect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
  }

  export type DeviceTokenCreateNestedManyWithoutUserInput = {
    create?: XOR<DeviceTokenCreateWithoutUserInput, DeviceTokenUncheckedCreateWithoutUserInput> | DeviceTokenCreateWithoutUserInput[] | DeviceTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DeviceTokenCreateOrConnectWithoutUserInput | DeviceTokenCreateOrConnectWithoutUserInput[]
    createMany?: DeviceTokenCreateManyUserInputEnvelope
    connect?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
  }

  export type CategoryUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<CategoryCreateWithoutUserInput, CategoryUncheckedCreateWithoutUserInput> | CategoryCreateWithoutUserInput[] | CategoryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutUserInput | CategoryCreateOrConnectWithoutUserInput[]
    createMany?: CategoryCreateManyUserInputEnvelope
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
  }

  export type SubcategoryUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SubcategoryCreateWithoutUserInput, SubcategoryUncheckedCreateWithoutUserInput> | SubcategoryCreateWithoutUserInput[] | SubcategoryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutUserInput | SubcategoryCreateOrConnectWithoutUserInput[]
    createMany?: SubcategoryCreateManyUserInputEnvelope
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
  }

  export type RecipientUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RecipientCreateWithoutUserInput, RecipientUncheckedCreateWithoutUserInput> | RecipientCreateWithoutUserInput[] | RecipientUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecipientCreateOrConnectWithoutUserInput | RecipientCreateOrConnectWithoutUserInput[]
    createMany?: RecipientCreateManyUserInputEnvelope
    connect?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput> | TransactionCreateWithoutUserInput[] | TransactionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutUserInput | TransactionCreateOrConnectWithoutUserInput[]
    createMany?: TransactionCreateManyUserInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type RawMessageUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RawMessageCreateWithoutUserInput, RawMessageUncheckedCreateWithoutUserInput> | RawMessageCreateWithoutUserInput[] | RawMessageUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RawMessageCreateOrConnectWithoutUserInput | RawMessageCreateOrConnectWithoutUserInput[]
    createMany?: RawMessageCreateManyUserInputEnvelope
    connect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
  }

  export type DeviceTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<DeviceTokenCreateWithoutUserInput, DeviceTokenUncheckedCreateWithoutUserInput> | DeviceTokenCreateWithoutUserInput[] | DeviceTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DeviceTokenCreateOrConnectWithoutUserInput | DeviceTokenCreateOrConnectWithoutUserInput[]
    createMany?: DeviceTokenCreateManyUserInputEnvelope
    connect?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CategoryUpdateManyWithoutUserNestedInput = {
    create?: XOR<CategoryCreateWithoutUserInput, CategoryUncheckedCreateWithoutUserInput> | CategoryCreateWithoutUserInput[] | CategoryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutUserInput | CategoryCreateOrConnectWithoutUserInput[]
    upsert?: CategoryUpsertWithWhereUniqueWithoutUserInput | CategoryUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CategoryCreateManyUserInputEnvelope
    set?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    disconnect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    delete?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    update?: CategoryUpdateWithWhereUniqueWithoutUserInput | CategoryUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CategoryUpdateManyWithWhereWithoutUserInput | CategoryUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
  }

  export type SubcategoryUpdateManyWithoutUserNestedInput = {
    create?: XOR<SubcategoryCreateWithoutUserInput, SubcategoryUncheckedCreateWithoutUserInput> | SubcategoryCreateWithoutUserInput[] | SubcategoryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutUserInput | SubcategoryCreateOrConnectWithoutUserInput[]
    upsert?: SubcategoryUpsertWithWhereUniqueWithoutUserInput | SubcategoryUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SubcategoryCreateManyUserInputEnvelope
    set?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    disconnect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    delete?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    update?: SubcategoryUpdateWithWhereUniqueWithoutUserInput | SubcategoryUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SubcategoryUpdateManyWithWhereWithoutUserInput | SubcategoryUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
  }

  export type RecipientUpdateManyWithoutUserNestedInput = {
    create?: XOR<RecipientCreateWithoutUserInput, RecipientUncheckedCreateWithoutUserInput> | RecipientCreateWithoutUserInput[] | RecipientUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecipientCreateOrConnectWithoutUserInput | RecipientCreateOrConnectWithoutUserInput[]
    upsert?: RecipientUpsertWithWhereUniqueWithoutUserInput | RecipientUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RecipientCreateManyUserInputEnvelope
    set?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
    disconnect?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
    delete?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
    connect?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
    update?: RecipientUpdateWithWhereUniqueWithoutUserInput | RecipientUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RecipientUpdateManyWithWhereWithoutUserInput | RecipientUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RecipientScalarWhereInput | RecipientScalarWhereInput[]
  }

  export type TransactionUpdateManyWithoutUserNestedInput = {
    create?: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput> | TransactionCreateWithoutUserInput[] | TransactionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutUserInput | TransactionCreateOrConnectWithoutUserInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutUserInput | TransactionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TransactionCreateManyUserInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutUserInput | TransactionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutUserInput | TransactionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type RawMessageUpdateManyWithoutUserNestedInput = {
    create?: XOR<RawMessageCreateWithoutUserInput, RawMessageUncheckedCreateWithoutUserInput> | RawMessageCreateWithoutUserInput[] | RawMessageUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RawMessageCreateOrConnectWithoutUserInput | RawMessageCreateOrConnectWithoutUserInput[]
    upsert?: RawMessageUpsertWithWhereUniqueWithoutUserInput | RawMessageUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RawMessageCreateManyUserInputEnvelope
    set?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    disconnect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    delete?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    connect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    update?: RawMessageUpdateWithWhereUniqueWithoutUserInput | RawMessageUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RawMessageUpdateManyWithWhereWithoutUserInput | RawMessageUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RawMessageScalarWhereInput | RawMessageScalarWhereInput[]
  }

  export type DeviceTokenUpdateManyWithoutUserNestedInput = {
    create?: XOR<DeviceTokenCreateWithoutUserInput, DeviceTokenUncheckedCreateWithoutUserInput> | DeviceTokenCreateWithoutUserInput[] | DeviceTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DeviceTokenCreateOrConnectWithoutUserInput | DeviceTokenCreateOrConnectWithoutUserInput[]
    upsert?: DeviceTokenUpsertWithWhereUniqueWithoutUserInput | DeviceTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: DeviceTokenCreateManyUserInputEnvelope
    set?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
    disconnect?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
    delete?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
    connect?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
    update?: DeviceTokenUpdateWithWhereUniqueWithoutUserInput | DeviceTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: DeviceTokenUpdateManyWithWhereWithoutUserInput | DeviceTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: DeviceTokenScalarWhereInput | DeviceTokenScalarWhereInput[]
  }

  export type CategoryUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<CategoryCreateWithoutUserInput, CategoryUncheckedCreateWithoutUserInput> | CategoryCreateWithoutUserInput[] | CategoryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CategoryCreateOrConnectWithoutUserInput | CategoryCreateOrConnectWithoutUserInput[]
    upsert?: CategoryUpsertWithWhereUniqueWithoutUserInput | CategoryUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CategoryCreateManyUserInputEnvelope
    set?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    disconnect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    delete?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    connect?: CategoryWhereUniqueInput | CategoryWhereUniqueInput[]
    update?: CategoryUpdateWithWhereUniqueWithoutUserInput | CategoryUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CategoryUpdateManyWithWhereWithoutUserInput | CategoryUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
  }

  export type SubcategoryUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SubcategoryCreateWithoutUserInput, SubcategoryUncheckedCreateWithoutUserInput> | SubcategoryCreateWithoutUserInput[] | SubcategoryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutUserInput | SubcategoryCreateOrConnectWithoutUserInput[]
    upsert?: SubcategoryUpsertWithWhereUniqueWithoutUserInput | SubcategoryUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SubcategoryCreateManyUserInputEnvelope
    set?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    disconnect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    delete?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    update?: SubcategoryUpdateWithWhereUniqueWithoutUserInput | SubcategoryUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SubcategoryUpdateManyWithWhereWithoutUserInput | SubcategoryUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
  }

  export type RecipientUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RecipientCreateWithoutUserInput, RecipientUncheckedCreateWithoutUserInput> | RecipientCreateWithoutUserInput[] | RecipientUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecipientCreateOrConnectWithoutUserInput | RecipientCreateOrConnectWithoutUserInput[]
    upsert?: RecipientUpsertWithWhereUniqueWithoutUserInput | RecipientUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RecipientCreateManyUserInputEnvelope
    set?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
    disconnect?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
    delete?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
    connect?: RecipientWhereUniqueInput | RecipientWhereUniqueInput[]
    update?: RecipientUpdateWithWhereUniqueWithoutUserInput | RecipientUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RecipientUpdateManyWithWhereWithoutUserInput | RecipientUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RecipientScalarWhereInput | RecipientScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput> | TransactionCreateWithoutUserInput[] | TransactionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutUserInput | TransactionCreateOrConnectWithoutUserInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutUserInput | TransactionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: TransactionCreateManyUserInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutUserInput | TransactionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutUserInput | TransactionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type RawMessageUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RawMessageCreateWithoutUserInput, RawMessageUncheckedCreateWithoutUserInput> | RawMessageCreateWithoutUserInput[] | RawMessageUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RawMessageCreateOrConnectWithoutUserInput | RawMessageCreateOrConnectWithoutUserInput[]
    upsert?: RawMessageUpsertWithWhereUniqueWithoutUserInput | RawMessageUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RawMessageCreateManyUserInputEnvelope
    set?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    disconnect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    delete?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    connect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    update?: RawMessageUpdateWithWhereUniqueWithoutUserInput | RawMessageUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RawMessageUpdateManyWithWhereWithoutUserInput | RawMessageUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RawMessageScalarWhereInput | RawMessageScalarWhereInput[]
  }

  export type DeviceTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<DeviceTokenCreateWithoutUserInput, DeviceTokenUncheckedCreateWithoutUserInput> | DeviceTokenCreateWithoutUserInput[] | DeviceTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DeviceTokenCreateOrConnectWithoutUserInput | DeviceTokenCreateOrConnectWithoutUserInput[]
    upsert?: DeviceTokenUpsertWithWhereUniqueWithoutUserInput | DeviceTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: DeviceTokenCreateManyUserInputEnvelope
    set?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
    disconnect?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
    delete?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
    connect?: DeviceTokenWhereUniqueInput | DeviceTokenWhereUniqueInput[]
    update?: DeviceTokenUpdateWithWhereUniqueWithoutUserInput | DeviceTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: DeviceTokenUpdateManyWithWhereWithoutUserInput | DeviceTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: DeviceTokenScalarWhereInput | DeviceTokenScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutCategoriesInput = {
    create?: XOR<UserCreateWithoutCategoriesInput, UserUncheckedCreateWithoutCategoriesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCategoriesInput
    connect?: UserWhereUniqueInput
  }

  export type SubcategoryCreateNestedManyWithoutCategoryInput = {
    create?: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput> | SubcategoryCreateWithoutCategoryInput[] | SubcategoryUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutCategoryInput | SubcategoryCreateOrConnectWithoutCategoryInput[]
    createMany?: SubcategoryCreateManyCategoryInputEnvelope
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
  }

  export type TransactionCreateNestedManyWithoutCategoryInput = {
    create?: XOR<TransactionCreateWithoutCategoryInput, TransactionUncheckedCreateWithoutCategoryInput> | TransactionCreateWithoutCategoryInput[] | TransactionUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutCategoryInput | TransactionCreateOrConnectWithoutCategoryInput[]
    createMany?: TransactionCreateManyCategoryInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type SubcategoryUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput> | SubcategoryCreateWithoutCategoryInput[] | SubcategoryUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutCategoryInput | SubcategoryCreateOrConnectWithoutCategoryInput[]
    createMany?: SubcategoryCreateManyCategoryInputEnvelope
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<TransactionCreateWithoutCategoryInput, TransactionUncheckedCreateWithoutCategoryInput> | TransactionCreateWithoutCategoryInput[] | TransactionUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutCategoryInput | TransactionCreateOrConnectWithoutCategoryInput[]
    createMany?: TransactionCreateManyCategoryInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutCategoriesNestedInput = {
    create?: XOR<UserCreateWithoutCategoriesInput, UserUncheckedCreateWithoutCategoriesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCategoriesInput
    upsert?: UserUpsertWithoutCategoriesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCategoriesInput, UserUpdateWithoutCategoriesInput>, UserUncheckedUpdateWithoutCategoriesInput>
  }

  export type SubcategoryUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput> | SubcategoryCreateWithoutCategoryInput[] | SubcategoryUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutCategoryInput | SubcategoryCreateOrConnectWithoutCategoryInput[]
    upsert?: SubcategoryUpsertWithWhereUniqueWithoutCategoryInput | SubcategoryUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: SubcategoryCreateManyCategoryInputEnvelope
    set?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    disconnect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    delete?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    update?: SubcategoryUpdateWithWhereUniqueWithoutCategoryInput | SubcategoryUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: SubcategoryUpdateManyWithWhereWithoutCategoryInput | SubcategoryUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
  }

  export type TransactionUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<TransactionCreateWithoutCategoryInput, TransactionUncheckedCreateWithoutCategoryInput> | TransactionCreateWithoutCategoryInput[] | TransactionUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutCategoryInput | TransactionCreateOrConnectWithoutCategoryInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutCategoryInput | TransactionUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: TransactionCreateManyCategoryInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutCategoryInput | TransactionUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutCategoryInput | TransactionUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type SubcategoryUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput> | SubcategoryCreateWithoutCategoryInput[] | SubcategoryUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutCategoryInput | SubcategoryCreateOrConnectWithoutCategoryInput[]
    upsert?: SubcategoryUpsertWithWhereUniqueWithoutCategoryInput | SubcategoryUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: SubcategoryCreateManyCategoryInputEnvelope
    set?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    disconnect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    delete?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    update?: SubcategoryUpdateWithWhereUniqueWithoutCategoryInput | SubcategoryUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: SubcategoryUpdateManyWithWhereWithoutCategoryInput | SubcategoryUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<TransactionCreateWithoutCategoryInput, TransactionUncheckedCreateWithoutCategoryInput> | TransactionCreateWithoutCategoryInput[] | TransactionUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutCategoryInput | TransactionCreateOrConnectWithoutCategoryInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutCategoryInput | TransactionUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: TransactionCreateManyCategoryInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutCategoryInput | TransactionUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutCategoryInput | TransactionUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutSubcategoriesInput = {
    create?: XOR<UserCreateWithoutSubcategoriesInput, UserUncheckedCreateWithoutSubcategoriesInput>
    connectOrCreate?: UserCreateOrConnectWithoutSubcategoriesInput
    connect?: UserWhereUniqueInput
  }

  export type CategoryCreateNestedOneWithoutSubcategoriesInput = {
    create?: XOR<CategoryCreateWithoutSubcategoriesInput, CategoryUncheckedCreateWithoutSubcategoriesInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutSubcategoriesInput
    connect?: CategoryWhereUniqueInput
  }

  export type TransactionCreateNestedManyWithoutSubcategoryInput = {
    create?: XOR<TransactionCreateWithoutSubcategoryInput, TransactionUncheckedCreateWithoutSubcategoryInput> | TransactionCreateWithoutSubcategoryInput[] | TransactionUncheckedCreateWithoutSubcategoryInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutSubcategoryInput | TransactionCreateOrConnectWithoutSubcategoryInput[]
    createMany?: TransactionCreateManySubcategoryInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutSubcategoryInput = {
    create?: XOR<TransactionCreateWithoutSubcategoryInput, TransactionUncheckedCreateWithoutSubcategoryInput> | TransactionCreateWithoutSubcategoryInput[] | TransactionUncheckedCreateWithoutSubcategoryInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutSubcategoryInput | TransactionCreateOrConnectWithoutSubcategoryInput[]
    createMany?: TransactionCreateManySubcategoryInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutSubcategoriesNestedInput = {
    create?: XOR<UserCreateWithoutSubcategoriesInput, UserUncheckedCreateWithoutSubcategoriesInput>
    connectOrCreate?: UserCreateOrConnectWithoutSubcategoriesInput
    upsert?: UserUpsertWithoutSubcategoriesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSubcategoriesInput, UserUpdateWithoutSubcategoriesInput>, UserUncheckedUpdateWithoutSubcategoriesInput>
  }

  export type CategoryUpdateOneRequiredWithoutSubcategoriesNestedInput = {
    create?: XOR<CategoryCreateWithoutSubcategoriesInput, CategoryUncheckedCreateWithoutSubcategoriesInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutSubcategoriesInput
    upsert?: CategoryUpsertWithoutSubcategoriesInput
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutSubcategoriesInput, CategoryUpdateWithoutSubcategoriesInput>, CategoryUncheckedUpdateWithoutSubcategoriesInput>
  }

  export type TransactionUpdateManyWithoutSubcategoryNestedInput = {
    create?: XOR<TransactionCreateWithoutSubcategoryInput, TransactionUncheckedCreateWithoutSubcategoryInput> | TransactionCreateWithoutSubcategoryInput[] | TransactionUncheckedCreateWithoutSubcategoryInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutSubcategoryInput | TransactionCreateOrConnectWithoutSubcategoryInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutSubcategoryInput | TransactionUpsertWithWhereUniqueWithoutSubcategoryInput[]
    createMany?: TransactionCreateManySubcategoryInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutSubcategoryInput | TransactionUpdateWithWhereUniqueWithoutSubcategoryInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutSubcategoryInput | TransactionUpdateManyWithWhereWithoutSubcategoryInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutSubcategoryNestedInput = {
    create?: XOR<TransactionCreateWithoutSubcategoryInput, TransactionUncheckedCreateWithoutSubcategoryInput> | TransactionCreateWithoutSubcategoryInput[] | TransactionUncheckedCreateWithoutSubcategoryInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutSubcategoryInput | TransactionCreateOrConnectWithoutSubcategoryInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutSubcategoryInput | TransactionUpsertWithWhereUniqueWithoutSubcategoryInput[]
    createMany?: TransactionCreateManySubcategoryInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutSubcategoryInput | TransactionUpdateWithWhereUniqueWithoutSubcategoryInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutSubcategoryInput | TransactionUpdateManyWithWhereWithoutSubcategoryInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutRecipientsInput = {
    create?: XOR<UserCreateWithoutRecipientsInput, UserUncheckedCreateWithoutRecipientsInput>
    connectOrCreate?: UserCreateOrConnectWithoutRecipientsInput
    connect?: UserWhereUniqueInput
  }

  export type RecipientIdentifierCreateNestedManyWithoutRecipientInput = {
    create?: XOR<RecipientIdentifierCreateWithoutRecipientInput, RecipientIdentifierUncheckedCreateWithoutRecipientInput> | RecipientIdentifierCreateWithoutRecipientInput[] | RecipientIdentifierUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: RecipientIdentifierCreateOrConnectWithoutRecipientInput | RecipientIdentifierCreateOrConnectWithoutRecipientInput[]
    createMany?: RecipientIdentifierCreateManyRecipientInputEnvelope
    connect?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
  }

  export type TransactionCreateNestedManyWithoutRecipientInput = {
    create?: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput> | TransactionCreateWithoutRecipientInput[] | TransactionUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutRecipientInput | TransactionCreateOrConnectWithoutRecipientInput[]
    createMany?: TransactionCreateManyRecipientInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type RecipientIdentifierUncheckedCreateNestedManyWithoutRecipientInput = {
    create?: XOR<RecipientIdentifierCreateWithoutRecipientInput, RecipientIdentifierUncheckedCreateWithoutRecipientInput> | RecipientIdentifierCreateWithoutRecipientInput[] | RecipientIdentifierUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: RecipientIdentifierCreateOrConnectWithoutRecipientInput | RecipientIdentifierCreateOrConnectWithoutRecipientInput[]
    createMany?: RecipientIdentifierCreateManyRecipientInputEnvelope
    connect?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutRecipientInput = {
    create?: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput> | TransactionCreateWithoutRecipientInput[] | TransactionUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutRecipientInput | TransactionCreateOrConnectWithoutRecipientInput[]
    createMany?: TransactionCreateManyRecipientInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutRecipientsNestedInput = {
    create?: XOR<UserCreateWithoutRecipientsInput, UserUncheckedCreateWithoutRecipientsInput>
    connectOrCreate?: UserCreateOrConnectWithoutRecipientsInput
    upsert?: UserUpsertWithoutRecipientsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRecipientsInput, UserUpdateWithoutRecipientsInput>, UserUncheckedUpdateWithoutRecipientsInput>
  }

  export type RecipientIdentifierUpdateManyWithoutRecipientNestedInput = {
    create?: XOR<RecipientIdentifierCreateWithoutRecipientInput, RecipientIdentifierUncheckedCreateWithoutRecipientInput> | RecipientIdentifierCreateWithoutRecipientInput[] | RecipientIdentifierUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: RecipientIdentifierCreateOrConnectWithoutRecipientInput | RecipientIdentifierCreateOrConnectWithoutRecipientInput[]
    upsert?: RecipientIdentifierUpsertWithWhereUniqueWithoutRecipientInput | RecipientIdentifierUpsertWithWhereUniqueWithoutRecipientInput[]
    createMany?: RecipientIdentifierCreateManyRecipientInputEnvelope
    set?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
    disconnect?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
    delete?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
    connect?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
    update?: RecipientIdentifierUpdateWithWhereUniqueWithoutRecipientInput | RecipientIdentifierUpdateWithWhereUniqueWithoutRecipientInput[]
    updateMany?: RecipientIdentifierUpdateManyWithWhereWithoutRecipientInput | RecipientIdentifierUpdateManyWithWhereWithoutRecipientInput[]
    deleteMany?: RecipientIdentifierScalarWhereInput | RecipientIdentifierScalarWhereInput[]
  }

  export type TransactionUpdateManyWithoutRecipientNestedInput = {
    create?: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput> | TransactionCreateWithoutRecipientInput[] | TransactionUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutRecipientInput | TransactionCreateOrConnectWithoutRecipientInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutRecipientInput | TransactionUpsertWithWhereUniqueWithoutRecipientInput[]
    createMany?: TransactionCreateManyRecipientInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutRecipientInput | TransactionUpdateWithWhereUniqueWithoutRecipientInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutRecipientInput | TransactionUpdateManyWithWhereWithoutRecipientInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type RecipientIdentifierUncheckedUpdateManyWithoutRecipientNestedInput = {
    create?: XOR<RecipientIdentifierCreateWithoutRecipientInput, RecipientIdentifierUncheckedCreateWithoutRecipientInput> | RecipientIdentifierCreateWithoutRecipientInput[] | RecipientIdentifierUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: RecipientIdentifierCreateOrConnectWithoutRecipientInput | RecipientIdentifierCreateOrConnectWithoutRecipientInput[]
    upsert?: RecipientIdentifierUpsertWithWhereUniqueWithoutRecipientInput | RecipientIdentifierUpsertWithWhereUniqueWithoutRecipientInput[]
    createMany?: RecipientIdentifierCreateManyRecipientInputEnvelope
    set?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
    disconnect?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
    delete?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
    connect?: RecipientIdentifierWhereUniqueInput | RecipientIdentifierWhereUniqueInput[]
    update?: RecipientIdentifierUpdateWithWhereUniqueWithoutRecipientInput | RecipientIdentifierUpdateWithWhereUniqueWithoutRecipientInput[]
    updateMany?: RecipientIdentifierUpdateManyWithWhereWithoutRecipientInput | RecipientIdentifierUpdateManyWithWhereWithoutRecipientInput[]
    deleteMany?: RecipientIdentifierScalarWhereInput | RecipientIdentifierScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutRecipientNestedInput = {
    create?: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput> | TransactionCreateWithoutRecipientInput[] | TransactionUncheckedCreateWithoutRecipientInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutRecipientInput | TransactionCreateOrConnectWithoutRecipientInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutRecipientInput | TransactionUpsertWithWhereUniqueWithoutRecipientInput[]
    createMany?: TransactionCreateManyRecipientInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutRecipientInput | TransactionUpdateWithWhereUniqueWithoutRecipientInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutRecipientInput | TransactionUpdateManyWithWhereWithoutRecipientInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type RecipientCreateNestedOneWithoutIdentifiersInput = {
    create?: XOR<RecipientCreateWithoutIdentifiersInput, RecipientUncheckedCreateWithoutIdentifiersInput>
    connectOrCreate?: RecipientCreateOrConnectWithoutIdentifiersInput
    connect?: RecipientWhereUniqueInput
  }

  export type EnumRecipientIdentifierKindFieldUpdateOperationsInput = {
    set?: $Enums.RecipientIdentifierKind
  }

  export type RecipientUpdateOneRequiredWithoutIdentifiersNestedInput = {
    create?: XOR<RecipientCreateWithoutIdentifiersInput, RecipientUncheckedCreateWithoutIdentifiersInput>
    connectOrCreate?: RecipientCreateOrConnectWithoutIdentifiersInput
    upsert?: RecipientUpsertWithoutIdentifiersInput
    connect?: RecipientWhereUniqueInput
    update?: XOR<XOR<RecipientUpdateToOneWithWhereWithoutIdentifiersInput, RecipientUpdateWithoutIdentifiersInput>, RecipientUncheckedUpdateWithoutIdentifiersInput>
  }

  export type UserCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<UserCreateWithoutTransactionsInput, UserUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutTransactionsInput
    connect?: UserWhereUniqueInput
  }

  export type RecipientCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<RecipientCreateWithoutTransactionsInput, RecipientUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: RecipientCreateOrConnectWithoutTransactionsInput
    connect?: RecipientWhereUniqueInput
  }

  export type CategoryCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<CategoryCreateWithoutTransactionsInput, CategoryUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutTransactionsInput
    connect?: CategoryWhereUniqueInput
  }

  export type SubcategoryCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<SubcategoryCreateWithoutTransactionsInput, SubcategoryUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: SubcategoryCreateOrConnectWithoutTransactionsInput
    connect?: SubcategoryWhereUniqueInput
  }

  export type RawMessageCreateNestedManyWithoutTransactionInput = {
    create?: XOR<RawMessageCreateWithoutTransactionInput, RawMessageUncheckedCreateWithoutTransactionInput> | RawMessageCreateWithoutTransactionInput[] | RawMessageUncheckedCreateWithoutTransactionInput[]
    connectOrCreate?: RawMessageCreateOrConnectWithoutTransactionInput | RawMessageCreateOrConnectWithoutTransactionInput[]
    createMany?: RawMessageCreateManyTransactionInputEnvelope
    connect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
  }

  export type RawMessageUncheckedCreateNestedManyWithoutTransactionInput = {
    create?: XOR<RawMessageCreateWithoutTransactionInput, RawMessageUncheckedCreateWithoutTransactionInput> | RawMessageCreateWithoutTransactionInput[] | RawMessageUncheckedCreateWithoutTransactionInput[]
    connectOrCreate?: RawMessageCreateOrConnectWithoutTransactionInput | RawMessageCreateOrConnectWithoutTransactionInput[]
    createMany?: RawMessageCreateManyTransactionInputEnvelope
    connect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type EnumTransactionTypeFieldUpdateOperationsInput = {
    set?: $Enums.TransactionType
  }

  export type EnumTransactionSourceFieldUpdateOperationsInput = {
    set?: $Enums.TransactionSource
  }

  export type UserUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<UserCreateWithoutTransactionsInput, UserUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutTransactionsInput
    upsert?: UserUpsertWithoutTransactionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTransactionsInput, UserUpdateWithoutTransactionsInput>, UserUncheckedUpdateWithoutTransactionsInput>
  }

  export type RecipientUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<RecipientCreateWithoutTransactionsInput, RecipientUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: RecipientCreateOrConnectWithoutTransactionsInput
    upsert?: RecipientUpsertWithoutTransactionsInput
    connect?: RecipientWhereUniqueInput
    update?: XOR<XOR<RecipientUpdateToOneWithWhereWithoutTransactionsInput, RecipientUpdateWithoutTransactionsInput>, RecipientUncheckedUpdateWithoutTransactionsInput>
  }

  export type CategoryUpdateOneWithoutTransactionsNestedInput = {
    create?: XOR<CategoryCreateWithoutTransactionsInput, CategoryUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutTransactionsInput
    upsert?: CategoryUpsertWithoutTransactionsInput
    disconnect?: CategoryWhereInput | boolean
    delete?: CategoryWhereInput | boolean
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutTransactionsInput, CategoryUpdateWithoutTransactionsInput>, CategoryUncheckedUpdateWithoutTransactionsInput>
  }

  export type SubcategoryUpdateOneWithoutTransactionsNestedInput = {
    create?: XOR<SubcategoryCreateWithoutTransactionsInput, SubcategoryUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: SubcategoryCreateOrConnectWithoutTransactionsInput
    upsert?: SubcategoryUpsertWithoutTransactionsInput
    disconnect?: SubcategoryWhereInput | boolean
    delete?: SubcategoryWhereInput | boolean
    connect?: SubcategoryWhereUniqueInput
    update?: XOR<XOR<SubcategoryUpdateToOneWithWhereWithoutTransactionsInput, SubcategoryUpdateWithoutTransactionsInput>, SubcategoryUncheckedUpdateWithoutTransactionsInput>
  }

  export type RawMessageUpdateManyWithoutTransactionNestedInput = {
    create?: XOR<RawMessageCreateWithoutTransactionInput, RawMessageUncheckedCreateWithoutTransactionInput> | RawMessageCreateWithoutTransactionInput[] | RawMessageUncheckedCreateWithoutTransactionInput[]
    connectOrCreate?: RawMessageCreateOrConnectWithoutTransactionInput | RawMessageCreateOrConnectWithoutTransactionInput[]
    upsert?: RawMessageUpsertWithWhereUniqueWithoutTransactionInput | RawMessageUpsertWithWhereUniqueWithoutTransactionInput[]
    createMany?: RawMessageCreateManyTransactionInputEnvelope
    set?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    disconnect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    delete?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    connect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    update?: RawMessageUpdateWithWhereUniqueWithoutTransactionInput | RawMessageUpdateWithWhereUniqueWithoutTransactionInput[]
    updateMany?: RawMessageUpdateManyWithWhereWithoutTransactionInput | RawMessageUpdateManyWithWhereWithoutTransactionInput[]
    deleteMany?: RawMessageScalarWhereInput | RawMessageScalarWhereInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type RawMessageUncheckedUpdateManyWithoutTransactionNestedInput = {
    create?: XOR<RawMessageCreateWithoutTransactionInput, RawMessageUncheckedCreateWithoutTransactionInput> | RawMessageCreateWithoutTransactionInput[] | RawMessageUncheckedCreateWithoutTransactionInput[]
    connectOrCreate?: RawMessageCreateOrConnectWithoutTransactionInput | RawMessageCreateOrConnectWithoutTransactionInput[]
    upsert?: RawMessageUpsertWithWhereUniqueWithoutTransactionInput | RawMessageUpsertWithWhereUniqueWithoutTransactionInput[]
    createMany?: RawMessageCreateManyTransactionInputEnvelope
    set?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    disconnect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    delete?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    connect?: RawMessageWhereUniqueInput | RawMessageWhereUniqueInput[]
    update?: RawMessageUpdateWithWhereUniqueWithoutTransactionInput | RawMessageUpdateWithWhereUniqueWithoutTransactionInput[]
    updateMany?: RawMessageUpdateManyWithWhereWithoutTransactionInput | RawMessageUpdateManyWithWhereWithoutTransactionInput[]
    deleteMany?: RawMessageScalarWhereInput | RawMessageScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutRawMessagesInput = {
    create?: XOR<UserCreateWithoutRawMessagesInput, UserUncheckedCreateWithoutRawMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutRawMessagesInput
    connect?: UserWhereUniqueInput
  }

  export type TransactionCreateNestedOneWithoutRawMessagesInput = {
    create?: XOR<TransactionCreateWithoutRawMessagesInput, TransactionUncheckedCreateWithoutRawMessagesInput>
    connectOrCreate?: TransactionCreateOrConnectWithoutRawMessagesInput
    connect?: TransactionWhereUniqueInput
  }

  export type EnumRawMessageSourceFieldUpdateOperationsInput = {
    set?: $Enums.RawMessageSource
  }

  export type EnumParseStatusFieldUpdateOperationsInput = {
    set?: $Enums.ParseStatus
  }

  export type UserUpdateOneRequiredWithoutRawMessagesNestedInput = {
    create?: XOR<UserCreateWithoutRawMessagesInput, UserUncheckedCreateWithoutRawMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutRawMessagesInput
    upsert?: UserUpsertWithoutRawMessagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRawMessagesInput, UserUpdateWithoutRawMessagesInput>, UserUncheckedUpdateWithoutRawMessagesInput>
  }

  export type TransactionUpdateOneWithoutRawMessagesNestedInput = {
    create?: XOR<TransactionCreateWithoutRawMessagesInput, TransactionUncheckedCreateWithoutRawMessagesInput>
    connectOrCreate?: TransactionCreateOrConnectWithoutRawMessagesInput
    upsert?: TransactionUpsertWithoutRawMessagesInput
    disconnect?: TransactionWhereInput | boolean
    delete?: TransactionWhereInput | boolean
    connect?: TransactionWhereUniqueInput
    update?: XOR<XOR<TransactionUpdateToOneWithWhereWithoutRawMessagesInput, TransactionUpdateWithoutRawMessagesInput>, TransactionUncheckedUpdateWithoutRawMessagesInput>
  }

  export type UserCreateNestedOneWithoutDeviceTokensInput = {
    create?: XOR<UserCreateWithoutDeviceTokensInput, UserUncheckedCreateWithoutDeviceTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutDeviceTokensInput
    connect?: UserWhereUniqueInput
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type UserUpdateOneRequiredWithoutDeviceTokensNestedInput = {
    create?: XOR<UserCreateWithoutDeviceTokensInput, UserUncheckedCreateWithoutDeviceTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutDeviceTokensInput
    upsert?: UserUpsertWithoutDeviceTokensInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutDeviceTokensInput, UserUpdateWithoutDeviceTokensInput>, UserUncheckedUpdateWithoutDeviceTokensInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumRecipientIdentifierKindFilter<$PrismaModel = never> = {
    equals?: $Enums.RecipientIdentifierKind | EnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    in?: $Enums.RecipientIdentifierKind[] | ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.RecipientIdentifierKind[] | ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    not?: NestedEnumRecipientIdentifierKindFilter<$PrismaModel> | $Enums.RecipientIdentifierKind
  }

  export type NestedEnumRecipientIdentifierKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RecipientIdentifierKind | EnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    in?: $Enums.RecipientIdentifierKind[] | ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.RecipientIdentifierKind[] | ListEnumRecipientIdentifierKindFieldRefInput<$PrismaModel>
    not?: NestedEnumRecipientIdentifierKindWithAggregatesFilter<$PrismaModel> | $Enums.RecipientIdentifierKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRecipientIdentifierKindFilter<$PrismaModel>
    _max?: NestedEnumRecipientIdentifierKindFilter<$PrismaModel>
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedEnumTransactionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeFilter<$PrismaModel> | $Enums.TransactionType
  }

  export type NestedEnumTransactionSourceFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionSource | EnumTransactionSourceFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionSource[] | ListEnumTransactionSourceFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionSource[] | ListEnumTransactionSourceFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionSourceFilter<$PrismaModel> | $Enums.TransactionSource
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransactionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionTypeFilter<$PrismaModel>
    _max?: NestedEnumTransactionTypeFilter<$PrismaModel>
  }

  export type NestedEnumTransactionSourceWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionSource | EnumTransactionSourceFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionSource[] | ListEnumTransactionSourceFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionSource[] | ListEnumTransactionSourceFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionSourceWithAggregatesFilter<$PrismaModel> | $Enums.TransactionSource
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionSourceFilter<$PrismaModel>
    _max?: NestedEnumTransactionSourceFilter<$PrismaModel>
  }

  export type NestedEnumRawMessageSourceFilter<$PrismaModel = never> = {
    equals?: $Enums.RawMessageSource | EnumRawMessageSourceFieldRefInput<$PrismaModel>
    in?: $Enums.RawMessageSource[] | ListEnumRawMessageSourceFieldRefInput<$PrismaModel>
    notIn?: $Enums.RawMessageSource[] | ListEnumRawMessageSourceFieldRefInput<$PrismaModel>
    not?: NestedEnumRawMessageSourceFilter<$PrismaModel> | $Enums.RawMessageSource
  }

  export type NestedEnumParseStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ParseStatus | EnumParseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ParseStatus[] | ListEnumParseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ParseStatus[] | ListEnumParseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumParseStatusFilter<$PrismaModel> | $Enums.ParseStatus
  }

  export type NestedEnumRawMessageSourceWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RawMessageSource | EnumRawMessageSourceFieldRefInput<$PrismaModel>
    in?: $Enums.RawMessageSource[] | ListEnumRawMessageSourceFieldRefInput<$PrismaModel>
    notIn?: $Enums.RawMessageSource[] | ListEnumRawMessageSourceFieldRefInput<$PrismaModel>
    not?: NestedEnumRawMessageSourceWithAggregatesFilter<$PrismaModel> | $Enums.RawMessageSource
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRawMessageSourceFilter<$PrismaModel>
    _max?: NestedEnumRawMessageSourceFilter<$PrismaModel>
  }

  export type NestedEnumParseStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ParseStatus | EnumParseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ParseStatus[] | ListEnumParseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ParseStatus[] | ListEnumParseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumParseStatusWithAggregatesFilter<$PrismaModel> | $Enums.ParseStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumParseStatusFilter<$PrismaModel>
    _max?: NestedEnumParseStatusFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type CategoryCreateWithoutUserInput = {
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryCreateNestedManyWithoutCategoryInput
    transactions?: TransactionCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateWithoutUserInput = {
    id?: number
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutCategoryInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryCreateOrConnectWithoutUserInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutUserInput, CategoryUncheckedCreateWithoutUserInput>
  }

  export type CategoryCreateManyUserInputEnvelope = {
    data: CategoryCreateManyUserInput | CategoryCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SubcategoryCreateWithoutUserInput = {
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    category: CategoryCreateNestedOneWithoutSubcategoriesInput
    transactions?: TransactionCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryUncheckedCreateWithoutUserInput = {
    id?: number
    uuid?: string
    categoryId: number
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryCreateOrConnectWithoutUserInput = {
    where: SubcategoryWhereUniqueInput
    create: XOR<SubcategoryCreateWithoutUserInput, SubcategoryUncheckedCreateWithoutUserInput>
  }

  export type SubcategoryCreateManyUserInputEnvelope = {
    data: SubcategoryCreateManyUserInput | SubcategoryCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type RecipientCreateWithoutUserInput = {
    uuid?: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
    identifiers?: RecipientIdentifierCreateNestedManyWithoutRecipientInput
    transactions?: TransactionCreateNestedManyWithoutRecipientInput
  }

  export type RecipientUncheckedCreateWithoutUserInput = {
    id?: number
    uuid?: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
    identifiers?: RecipientIdentifierUncheckedCreateNestedManyWithoutRecipientInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
  }

  export type RecipientCreateOrConnectWithoutUserInput = {
    where: RecipientWhereUniqueInput
    create: XOR<RecipientCreateWithoutUserInput, RecipientUncheckedCreateWithoutUserInput>
  }

  export type RecipientCreateManyUserInputEnvelope = {
    data: RecipientCreateManyUserInput | RecipientCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type TransactionCreateWithoutUserInput = {
    uuid?: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    recipient: RecipientCreateNestedOneWithoutTransactionsInput
    category?: CategoryCreateNestedOneWithoutTransactionsInput
    subcategory?: SubcategoryCreateNestedOneWithoutTransactionsInput
    rawMessages?: RawMessageCreateNestedManyWithoutTransactionInput
  }

  export type TransactionUncheckedCreateWithoutUserInput = {
    id?: number
    uuid?: string
    recipientId: number
    categoryId?: number | null
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutTransactionInput
  }

  export type TransactionCreateOrConnectWithoutUserInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput>
  }

  export type TransactionCreateManyUserInputEnvelope = {
    data: TransactionCreateManyUserInput | TransactionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type RawMessageCreateWithoutUserInput = {
    uuid?: string
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
    transaction?: TransactionCreateNestedOneWithoutRawMessagesInput
  }

  export type RawMessageUncheckedCreateWithoutUserInput = {
    id?: number
    uuid?: string
    transactionId?: number | null
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
  }

  export type RawMessageCreateOrConnectWithoutUserInput = {
    where: RawMessageWhereUniqueInput
    create: XOR<RawMessageCreateWithoutUserInput, RawMessageUncheckedCreateWithoutUserInput>
  }

  export type RawMessageCreateManyUserInputEnvelope = {
    data: RawMessageCreateManyUserInput | RawMessageCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type DeviceTokenCreateWithoutUserInput = {
    uuid?: string
    label?: string | null
    tokenHash: string
    tokenPrefix: string
    createdAt?: Date | string
    lastUsedAt?: Date | string | null
    revokedAt?: Date | string | null
  }

  export type DeviceTokenUncheckedCreateWithoutUserInput = {
    id?: number
    uuid?: string
    label?: string | null
    tokenHash: string
    tokenPrefix: string
    createdAt?: Date | string
    lastUsedAt?: Date | string | null
    revokedAt?: Date | string | null
  }

  export type DeviceTokenCreateOrConnectWithoutUserInput = {
    where: DeviceTokenWhereUniqueInput
    create: XOR<DeviceTokenCreateWithoutUserInput, DeviceTokenUncheckedCreateWithoutUserInput>
  }

  export type DeviceTokenCreateManyUserInputEnvelope = {
    data: DeviceTokenCreateManyUserInput | DeviceTokenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type CategoryUpsertWithWhereUniqueWithoutUserInput = {
    where: CategoryWhereUniqueInput
    update: XOR<CategoryUpdateWithoutUserInput, CategoryUncheckedUpdateWithoutUserInput>
    create: XOR<CategoryCreateWithoutUserInput, CategoryUncheckedCreateWithoutUserInput>
  }

  export type CategoryUpdateWithWhereUniqueWithoutUserInput = {
    where: CategoryWhereUniqueInput
    data: XOR<CategoryUpdateWithoutUserInput, CategoryUncheckedUpdateWithoutUserInput>
  }

  export type CategoryUpdateManyWithWhereWithoutUserInput = {
    where: CategoryScalarWhereInput
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyWithoutUserInput>
  }

  export type CategoryScalarWhereInput = {
    AND?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
    OR?: CategoryScalarWhereInput[]
    NOT?: CategoryScalarWhereInput | CategoryScalarWhereInput[]
    id?: IntFilter<"Category"> | number
    uuid?: StringFilter<"Category"> | string
    userUuid?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
  }

  export type SubcategoryUpsertWithWhereUniqueWithoutUserInput = {
    where: SubcategoryWhereUniqueInput
    update: XOR<SubcategoryUpdateWithoutUserInput, SubcategoryUncheckedUpdateWithoutUserInput>
    create: XOR<SubcategoryCreateWithoutUserInput, SubcategoryUncheckedCreateWithoutUserInput>
  }

  export type SubcategoryUpdateWithWhereUniqueWithoutUserInput = {
    where: SubcategoryWhereUniqueInput
    data: XOR<SubcategoryUpdateWithoutUserInput, SubcategoryUncheckedUpdateWithoutUserInput>
  }

  export type SubcategoryUpdateManyWithWhereWithoutUserInput = {
    where: SubcategoryScalarWhereInput
    data: XOR<SubcategoryUpdateManyMutationInput, SubcategoryUncheckedUpdateManyWithoutUserInput>
  }

  export type SubcategoryScalarWhereInput = {
    AND?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
    OR?: SubcategoryScalarWhereInput[]
    NOT?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
    id?: IntFilter<"Subcategory"> | number
    uuid?: StringFilter<"Subcategory"> | string
    userUuid?: StringFilter<"Subcategory"> | string
    categoryId?: IntFilter<"Subcategory"> | number
    name?: StringFilter<"Subcategory"> | string
    createdAt?: DateTimeFilter<"Subcategory"> | Date | string
    updatedAt?: DateTimeFilter<"Subcategory"> | Date | string
  }

  export type RecipientUpsertWithWhereUniqueWithoutUserInput = {
    where: RecipientWhereUniqueInput
    update: XOR<RecipientUpdateWithoutUserInput, RecipientUncheckedUpdateWithoutUserInput>
    create: XOR<RecipientCreateWithoutUserInput, RecipientUncheckedCreateWithoutUserInput>
  }

  export type RecipientUpdateWithWhereUniqueWithoutUserInput = {
    where: RecipientWhereUniqueInput
    data: XOR<RecipientUpdateWithoutUserInput, RecipientUncheckedUpdateWithoutUserInput>
  }

  export type RecipientUpdateManyWithWhereWithoutUserInput = {
    where: RecipientScalarWhereInput
    data: XOR<RecipientUpdateManyMutationInput, RecipientUncheckedUpdateManyWithoutUserInput>
  }

  export type RecipientScalarWhereInput = {
    AND?: RecipientScalarWhereInput | RecipientScalarWhereInput[]
    OR?: RecipientScalarWhereInput[]
    NOT?: RecipientScalarWhereInput | RecipientScalarWhereInput[]
    id?: IntFilter<"Recipient"> | number
    uuid?: StringFilter<"Recipient"> | string
    userUuid?: StringFilter<"Recipient"> | string
    displayName?: StringFilter<"Recipient"> | string
    normalizedName?: StringFilter<"Recipient"> | string
    createdAt?: DateTimeFilter<"Recipient"> | Date | string
    updatedAt?: DateTimeFilter<"Recipient"> | Date | string
  }

  export type TransactionUpsertWithWhereUniqueWithoutUserInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutUserInput, TransactionUncheckedUpdateWithoutUserInput>
    create: XOR<TransactionCreateWithoutUserInput, TransactionUncheckedCreateWithoutUserInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutUserInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutUserInput, TransactionUncheckedUpdateWithoutUserInput>
  }

  export type TransactionUpdateManyWithWhereWithoutUserInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutUserInput>
  }

  export type TransactionScalarWhereInput = {
    AND?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    OR?: TransactionScalarWhereInput[]
    NOT?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    id?: IntFilter<"Transaction"> | number
    uuid?: StringFilter<"Transaction"> | string
    userUuid?: StringFilter<"Transaction"> | string
    recipientId?: IntFilter<"Transaction"> | number
    categoryId?: IntNullableFilter<"Transaction"> | number | null
    subcategoryId?: IntNullableFilter<"Transaction"> | number | null
    amount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Transaction"> | string
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    source?: EnumTransactionSourceFilter<"Transaction"> | $Enums.TransactionSource
    recipientRaw?: StringFilter<"Transaction"> | string
    recipientName?: StringNullableFilter<"Transaction"> | string | null
    reference?: StringNullableFilter<"Transaction"> | string | null
    accountLabel?: StringNullableFilter<"Transaction"> | string | null
    remarks?: StringNullableFilter<"Transaction"> | string | null
    locationRaw?: StringNullableFilter<"Transaction"> | string | null
    timestamp?: DateTimeFilter<"Transaction"> | Date | string
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    updatedAt?: DateTimeFilter<"Transaction"> | Date | string
  }

  export type RawMessageUpsertWithWhereUniqueWithoutUserInput = {
    where: RawMessageWhereUniqueInput
    update: XOR<RawMessageUpdateWithoutUserInput, RawMessageUncheckedUpdateWithoutUserInput>
    create: XOR<RawMessageCreateWithoutUserInput, RawMessageUncheckedCreateWithoutUserInput>
  }

  export type RawMessageUpdateWithWhereUniqueWithoutUserInput = {
    where: RawMessageWhereUniqueInput
    data: XOR<RawMessageUpdateWithoutUserInput, RawMessageUncheckedUpdateWithoutUserInput>
  }

  export type RawMessageUpdateManyWithWhereWithoutUserInput = {
    where: RawMessageScalarWhereInput
    data: XOR<RawMessageUpdateManyMutationInput, RawMessageUncheckedUpdateManyWithoutUserInput>
  }

  export type RawMessageScalarWhereInput = {
    AND?: RawMessageScalarWhereInput | RawMessageScalarWhereInput[]
    OR?: RawMessageScalarWhereInput[]
    NOT?: RawMessageScalarWhereInput | RawMessageScalarWhereInput[]
    id?: IntFilter<"RawMessage"> | number
    uuid?: StringFilter<"RawMessage"> | string
    userUuid?: StringFilter<"RawMessage"> | string
    transactionId?: IntNullableFilter<"RawMessage"> | number | null
    body?: StringFilter<"RawMessage"> | string
    source?: EnumRawMessageSourceFilter<"RawMessage"> | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFilter<"RawMessage"> | $Enums.ParseStatus
    parserName?: StringNullableFilter<"RawMessage"> | string | null
    failureReason?: StringNullableFilter<"RawMessage"> | string | null
    parsedPayload?: JsonNullableFilter<"RawMessage">
    locationRaw?: StringNullableFilter<"RawMessage"> | string | null
    receivedAt?: DateTimeFilter<"RawMessage"> | Date | string
    createdAt?: DateTimeFilter<"RawMessage"> | Date | string
  }

  export type DeviceTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: DeviceTokenWhereUniqueInput
    update: XOR<DeviceTokenUpdateWithoutUserInput, DeviceTokenUncheckedUpdateWithoutUserInput>
    create: XOR<DeviceTokenCreateWithoutUserInput, DeviceTokenUncheckedCreateWithoutUserInput>
  }

  export type DeviceTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: DeviceTokenWhereUniqueInput
    data: XOR<DeviceTokenUpdateWithoutUserInput, DeviceTokenUncheckedUpdateWithoutUserInput>
  }

  export type DeviceTokenUpdateManyWithWhereWithoutUserInput = {
    where: DeviceTokenScalarWhereInput
    data: XOR<DeviceTokenUpdateManyMutationInput, DeviceTokenUncheckedUpdateManyWithoutUserInput>
  }

  export type DeviceTokenScalarWhereInput = {
    AND?: DeviceTokenScalarWhereInput | DeviceTokenScalarWhereInput[]
    OR?: DeviceTokenScalarWhereInput[]
    NOT?: DeviceTokenScalarWhereInput | DeviceTokenScalarWhereInput[]
    id?: IntFilter<"DeviceToken"> | number
    uuid?: StringFilter<"DeviceToken"> | string
    userUuid?: StringFilter<"DeviceToken"> | string
    label?: StringNullableFilter<"DeviceToken"> | string | null
    tokenHash?: StringFilter<"DeviceToken"> | string
    tokenPrefix?: StringFilter<"DeviceToken"> | string
    createdAt?: DateTimeFilter<"DeviceToken"> | Date | string
    lastUsedAt?: DateTimeNullableFilter<"DeviceToken"> | Date | string | null
    revokedAt?: DateTimeNullableFilter<"DeviceToken"> | Date | string | null
  }

  export type UserCreateWithoutCategoriesInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryCreateNestedManyWithoutUserInput
    recipients?: RecipientCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCategoriesInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutUserInput
    recipients?: RecipientUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCategoriesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCategoriesInput, UserUncheckedCreateWithoutCategoriesInput>
  }

  export type SubcategoryCreateWithoutCategoryInput = {
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSubcategoriesInput
    transactions?: TransactionCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryUncheckedCreateWithoutCategoryInput = {
    id?: number
    uuid?: string
    userUuid: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryCreateOrConnectWithoutCategoryInput = {
    where: SubcategoryWhereUniqueInput
    create: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput>
  }

  export type SubcategoryCreateManyCategoryInputEnvelope = {
    data: SubcategoryCreateManyCategoryInput | SubcategoryCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type TransactionCreateWithoutCategoryInput = {
    uuid?: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutTransactionsInput
    recipient: RecipientCreateNestedOneWithoutTransactionsInput
    subcategory?: SubcategoryCreateNestedOneWithoutTransactionsInput
    rawMessages?: RawMessageCreateNestedManyWithoutTransactionInput
  }

  export type TransactionUncheckedCreateWithoutCategoryInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutTransactionInput
  }

  export type TransactionCreateOrConnectWithoutCategoryInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutCategoryInput, TransactionUncheckedCreateWithoutCategoryInput>
  }

  export type TransactionCreateManyCategoryInputEnvelope = {
    data: TransactionCreateManyCategoryInput | TransactionCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutCategoriesInput = {
    update: XOR<UserUpdateWithoutCategoriesInput, UserUncheckedUpdateWithoutCategoriesInput>
    create: XOR<UserCreateWithoutCategoriesInput, UserUncheckedCreateWithoutCategoriesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCategoriesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCategoriesInput, UserUncheckedUpdateWithoutCategoriesInput>
  }

  export type UserUpdateWithoutCategoriesInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUpdateManyWithoutUserNestedInput
    recipients?: RecipientUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCategoriesInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUncheckedUpdateManyWithoutUserNestedInput
    recipients?: RecipientUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUncheckedUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type SubcategoryUpsertWithWhereUniqueWithoutCategoryInput = {
    where: SubcategoryWhereUniqueInput
    update: XOR<SubcategoryUpdateWithoutCategoryInput, SubcategoryUncheckedUpdateWithoutCategoryInput>
    create: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput>
  }

  export type SubcategoryUpdateWithWhereUniqueWithoutCategoryInput = {
    where: SubcategoryWhereUniqueInput
    data: XOR<SubcategoryUpdateWithoutCategoryInput, SubcategoryUncheckedUpdateWithoutCategoryInput>
  }

  export type SubcategoryUpdateManyWithWhereWithoutCategoryInput = {
    where: SubcategoryScalarWhereInput
    data: XOR<SubcategoryUpdateManyMutationInput, SubcategoryUncheckedUpdateManyWithoutCategoryInput>
  }

  export type TransactionUpsertWithWhereUniqueWithoutCategoryInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutCategoryInput, TransactionUncheckedUpdateWithoutCategoryInput>
    create: XOR<TransactionCreateWithoutCategoryInput, TransactionUncheckedCreateWithoutCategoryInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutCategoryInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutCategoryInput, TransactionUncheckedUpdateWithoutCategoryInput>
  }

  export type TransactionUpdateManyWithWhereWithoutCategoryInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutCategoryInput>
  }

  export type UserCreateWithoutSubcategoriesInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryCreateNestedManyWithoutUserInput
    recipients?: RecipientCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSubcategoriesInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryUncheckedCreateNestedManyWithoutUserInput
    recipients?: RecipientUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSubcategoriesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSubcategoriesInput, UserUncheckedCreateWithoutSubcategoriesInput>
  }

  export type CategoryCreateWithoutSubcategoriesInput = {
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCategoriesInput
    transactions?: TransactionCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateWithoutSubcategoriesInput = {
    id?: number
    uuid?: string
    userUuid: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryCreateOrConnectWithoutSubcategoriesInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutSubcategoriesInput, CategoryUncheckedCreateWithoutSubcategoriesInput>
  }

  export type TransactionCreateWithoutSubcategoryInput = {
    uuid?: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutTransactionsInput
    recipient: RecipientCreateNestedOneWithoutTransactionsInput
    category?: CategoryCreateNestedOneWithoutTransactionsInput
    rawMessages?: RawMessageCreateNestedManyWithoutTransactionInput
  }

  export type TransactionUncheckedCreateWithoutSubcategoryInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    categoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutTransactionInput
  }

  export type TransactionCreateOrConnectWithoutSubcategoryInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutSubcategoryInput, TransactionUncheckedCreateWithoutSubcategoryInput>
  }

  export type TransactionCreateManySubcategoryInputEnvelope = {
    data: TransactionCreateManySubcategoryInput | TransactionCreateManySubcategoryInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutSubcategoriesInput = {
    update: XOR<UserUpdateWithoutSubcategoriesInput, UserUncheckedUpdateWithoutSubcategoriesInput>
    create: XOR<UserCreateWithoutSubcategoriesInput, UserUncheckedCreateWithoutSubcategoriesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSubcategoriesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSubcategoriesInput, UserUncheckedUpdateWithoutSubcategoriesInput>
  }

  export type UserUpdateWithoutSubcategoriesInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUpdateManyWithoutUserNestedInput
    recipients?: RecipientUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSubcategoriesInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUncheckedUpdateManyWithoutUserNestedInput
    recipients?: RecipientUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUncheckedUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type CategoryUpsertWithoutSubcategoriesInput = {
    update: XOR<CategoryUpdateWithoutSubcategoriesInput, CategoryUncheckedUpdateWithoutSubcategoriesInput>
    create: XOR<CategoryCreateWithoutSubcategoriesInput, CategoryUncheckedCreateWithoutSubcategoriesInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutSubcategoriesInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutSubcategoriesInput, CategoryUncheckedUpdateWithoutSubcategoriesInput>
  }

  export type CategoryUpdateWithoutSubcategoriesInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCategoriesNestedInput
    transactions?: TransactionUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateWithoutSubcategoriesInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type TransactionUpsertWithWhereUniqueWithoutSubcategoryInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutSubcategoryInput, TransactionUncheckedUpdateWithoutSubcategoryInput>
    create: XOR<TransactionCreateWithoutSubcategoryInput, TransactionUncheckedCreateWithoutSubcategoryInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutSubcategoryInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutSubcategoryInput, TransactionUncheckedUpdateWithoutSubcategoryInput>
  }

  export type TransactionUpdateManyWithWhereWithoutSubcategoryInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutSubcategoryInput>
  }

  export type UserCreateWithoutRecipientsInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRecipientsInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryUncheckedCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRecipientsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRecipientsInput, UserUncheckedCreateWithoutRecipientsInput>
  }

  export type RecipientIdentifierCreateWithoutRecipientInput = {
    uuid?: string
    userUuid: string
    kind: $Enums.RecipientIdentifierKind
    value: string
    normalizedValue: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecipientIdentifierUncheckedCreateWithoutRecipientInput = {
    id?: number
    uuid?: string
    userUuid: string
    kind: $Enums.RecipientIdentifierKind
    value: string
    normalizedValue: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecipientIdentifierCreateOrConnectWithoutRecipientInput = {
    where: RecipientIdentifierWhereUniqueInput
    create: XOR<RecipientIdentifierCreateWithoutRecipientInput, RecipientIdentifierUncheckedCreateWithoutRecipientInput>
  }

  export type RecipientIdentifierCreateManyRecipientInputEnvelope = {
    data: RecipientIdentifierCreateManyRecipientInput | RecipientIdentifierCreateManyRecipientInput[]
    skipDuplicates?: boolean
  }

  export type TransactionCreateWithoutRecipientInput = {
    uuid?: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutTransactionsInput
    category?: CategoryCreateNestedOneWithoutTransactionsInput
    subcategory?: SubcategoryCreateNestedOneWithoutTransactionsInput
    rawMessages?: RawMessageCreateNestedManyWithoutTransactionInput
  }

  export type TransactionUncheckedCreateWithoutRecipientInput = {
    id?: number
    uuid?: string
    userUuid: string
    categoryId?: number | null
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutTransactionInput
  }

  export type TransactionCreateOrConnectWithoutRecipientInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput>
  }

  export type TransactionCreateManyRecipientInputEnvelope = {
    data: TransactionCreateManyRecipientInput | TransactionCreateManyRecipientInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutRecipientsInput = {
    update: XOR<UserUpdateWithoutRecipientsInput, UserUncheckedUpdateWithoutRecipientsInput>
    create: XOR<UserCreateWithoutRecipientsInput, UserUncheckedCreateWithoutRecipientsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRecipientsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRecipientsInput, UserUncheckedUpdateWithoutRecipientsInput>
  }

  export type UserUpdateWithoutRecipientsInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRecipientsInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUncheckedUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUncheckedUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type RecipientIdentifierUpsertWithWhereUniqueWithoutRecipientInput = {
    where: RecipientIdentifierWhereUniqueInput
    update: XOR<RecipientIdentifierUpdateWithoutRecipientInput, RecipientIdentifierUncheckedUpdateWithoutRecipientInput>
    create: XOR<RecipientIdentifierCreateWithoutRecipientInput, RecipientIdentifierUncheckedCreateWithoutRecipientInput>
  }

  export type RecipientIdentifierUpdateWithWhereUniqueWithoutRecipientInput = {
    where: RecipientIdentifierWhereUniqueInput
    data: XOR<RecipientIdentifierUpdateWithoutRecipientInput, RecipientIdentifierUncheckedUpdateWithoutRecipientInput>
  }

  export type RecipientIdentifierUpdateManyWithWhereWithoutRecipientInput = {
    where: RecipientIdentifierScalarWhereInput
    data: XOR<RecipientIdentifierUpdateManyMutationInput, RecipientIdentifierUncheckedUpdateManyWithoutRecipientInput>
  }

  export type RecipientIdentifierScalarWhereInput = {
    AND?: RecipientIdentifierScalarWhereInput | RecipientIdentifierScalarWhereInput[]
    OR?: RecipientIdentifierScalarWhereInput[]
    NOT?: RecipientIdentifierScalarWhereInput | RecipientIdentifierScalarWhereInput[]
    id?: IntFilter<"RecipientIdentifier"> | number
    uuid?: StringFilter<"RecipientIdentifier"> | string
    userUuid?: StringFilter<"RecipientIdentifier"> | string
    recipientId?: IntFilter<"RecipientIdentifier"> | number
    kind?: EnumRecipientIdentifierKindFilter<"RecipientIdentifier"> | $Enums.RecipientIdentifierKind
    value?: StringFilter<"RecipientIdentifier"> | string
    normalizedValue?: StringFilter<"RecipientIdentifier"> | string
    createdAt?: DateTimeFilter<"RecipientIdentifier"> | Date | string
    updatedAt?: DateTimeFilter<"RecipientIdentifier"> | Date | string
  }

  export type TransactionUpsertWithWhereUniqueWithoutRecipientInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutRecipientInput, TransactionUncheckedUpdateWithoutRecipientInput>
    create: XOR<TransactionCreateWithoutRecipientInput, TransactionUncheckedCreateWithoutRecipientInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutRecipientInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutRecipientInput, TransactionUncheckedUpdateWithoutRecipientInput>
  }

  export type TransactionUpdateManyWithWhereWithoutRecipientInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutRecipientInput>
  }

  export type RecipientCreateWithoutIdentifiersInput = {
    uuid?: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutRecipientsInput
    transactions?: TransactionCreateNestedManyWithoutRecipientInput
  }

  export type RecipientUncheckedCreateWithoutIdentifiersInput = {
    id?: number
    uuid?: string
    userUuid: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutRecipientInput
  }

  export type RecipientCreateOrConnectWithoutIdentifiersInput = {
    where: RecipientWhereUniqueInput
    create: XOR<RecipientCreateWithoutIdentifiersInput, RecipientUncheckedCreateWithoutIdentifiersInput>
  }

  export type RecipientUpsertWithoutIdentifiersInput = {
    update: XOR<RecipientUpdateWithoutIdentifiersInput, RecipientUncheckedUpdateWithoutIdentifiersInput>
    create: XOR<RecipientCreateWithoutIdentifiersInput, RecipientUncheckedCreateWithoutIdentifiersInput>
    where?: RecipientWhereInput
  }

  export type RecipientUpdateToOneWithWhereWithoutIdentifiersInput = {
    where?: RecipientWhereInput
    data: XOR<RecipientUpdateWithoutIdentifiersInput, RecipientUncheckedUpdateWithoutIdentifiersInput>
  }

  export type RecipientUpdateWithoutIdentifiersInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRecipientsNestedInput
    transactions?: TransactionUpdateManyWithoutRecipientNestedInput
  }

  export type RecipientUncheckedUpdateWithoutIdentifiersInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
  }

  export type UserCreateWithoutTransactionsInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryCreateNestedManyWithoutUserInput
    recipients?: RecipientCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTransactionsInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryUncheckedCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutUserInput
    recipients?: RecipientUncheckedCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTransactionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTransactionsInput, UserUncheckedCreateWithoutTransactionsInput>
  }

  export type RecipientCreateWithoutTransactionsInput = {
    uuid?: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutRecipientsInput
    identifiers?: RecipientIdentifierCreateNestedManyWithoutRecipientInput
  }

  export type RecipientUncheckedCreateWithoutTransactionsInput = {
    id?: number
    uuid?: string
    userUuid: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
    identifiers?: RecipientIdentifierUncheckedCreateNestedManyWithoutRecipientInput
  }

  export type RecipientCreateOrConnectWithoutTransactionsInput = {
    where: RecipientWhereUniqueInput
    create: XOR<RecipientCreateWithoutTransactionsInput, RecipientUncheckedCreateWithoutTransactionsInput>
  }

  export type CategoryCreateWithoutTransactionsInput = {
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCategoriesInput
    subcategories?: SubcategoryCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateWithoutTransactionsInput = {
    id?: number
    uuid?: string
    userUuid: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryCreateOrConnectWithoutTransactionsInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutTransactionsInput, CategoryUncheckedCreateWithoutTransactionsInput>
  }

  export type SubcategoryCreateWithoutTransactionsInput = {
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSubcategoriesInput
    category: CategoryCreateNestedOneWithoutSubcategoriesInput
  }

  export type SubcategoryUncheckedCreateWithoutTransactionsInput = {
    id?: number
    uuid?: string
    userUuid: string
    categoryId: number
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubcategoryCreateOrConnectWithoutTransactionsInput = {
    where: SubcategoryWhereUniqueInput
    create: XOR<SubcategoryCreateWithoutTransactionsInput, SubcategoryUncheckedCreateWithoutTransactionsInput>
  }

  export type RawMessageCreateWithoutTransactionInput = {
    uuid?: string
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutRawMessagesInput
  }

  export type RawMessageUncheckedCreateWithoutTransactionInput = {
    id?: number
    uuid?: string
    userUuid: string
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
  }

  export type RawMessageCreateOrConnectWithoutTransactionInput = {
    where: RawMessageWhereUniqueInput
    create: XOR<RawMessageCreateWithoutTransactionInput, RawMessageUncheckedCreateWithoutTransactionInput>
  }

  export type RawMessageCreateManyTransactionInputEnvelope = {
    data: RawMessageCreateManyTransactionInput | RawMessageCreateManyTransactionInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutTransactionsInput = {
    update: XOR<UserUpdateWithoutTransactionsInput, UserUncheckedUpdateWithoutTransactionsInput>
    create: XOR<UserCreateWithoutTransactionsInput, UserUncheckedCreateWithoutTransactionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTransactionsInput, UserUncheckedUpdateWithoutTransactionsInput>
  }

  export type UserUpdateWithoutTransactionsInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUpdateManyWithoutUserNestedInput
    recipients?: RecipientUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTransactionsInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUncheckedUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUncheckedUpdateManyWithoutUserNestedInput
    recipients?: RecipientUncheckedUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUncheckedUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type RecipientUpsertWithoutTransactionsInput = {
    update: XOR<RecipientUpdateWithoutTransactionsInput, RecipientUncheckedUpdateWithoutTransactionsInput>
    create: XOR<RecipientCreateWithoutTransactionsInput, RecipientUncheckedCreateWithoutTransactionsInput>
    where?: RecipientWhereInput
  }

  export type RecipientUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: RecipientWhereInput
    data: XOR<RecipientUpdateWithoutTransactionsInput, RecipientUncheckedUpdateWithoutTransactionsInput>
  }

  export type RecipientUpdateWithoutTransactionsInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRecipientsNestedInput
    identifiers?: RecipientIdentifierUpdateManyWithoutRecipientNestedInput
  }

  export type RecipientUncheckedUpdateWithoutTransactionsInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    identifiers?: RecipientIdentifierUncheckedUpdateManyWithoutRecipientNestedInput
  }

  export type CategoryUpsertWithoutTransactionsInput = {
    update: XOR<CategoryUpdateWithoutTransactionsInput, CategoryUncheckedUpdateWithoutTransactionsInput>
    create: XOR<CategoryCreateWithoutTransactionsInput, CategoryUncheckedCreateWithoutTransactionsInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutTransactionsInput, CategoryUncheckedUpdateWithoutTransactionsInput>
  }

  export type CategoryUpdateWithoutTransactionsInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCategoriesNestedInput
    subcategories?: SubcategoryUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateWithoutTransactionsInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type SubcategoryUpsertWithoutTransactionsInput = {
    update: XOR<SubcategoryUpdateWithoutTransactionsInput, SubcategoryUncheckedUpdateWithoutTransactionsInput>
    create: XOR<SubcategoryCreateWithoutTransactionsInput, SubcategoryUncheckedCreateWithoutTransactionsInput>
    where?: SubcategoryWhereInput
  }

  export type SubcategoryUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: SubcategoryWhereInput
    data: XOR<SubcategoryUpdateWithoutTransactionsInput, SubcategoryUncheckedUpdateWithoutTransactionsInput>
  }

  export type SubcategoryUpdateWithoutTransactionsInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSubcategoriesNestedInput
    category?: CategoryUpdateOneRequiredWithoutSubcategoriesNestedInput
  }

  export type SubcategoryUncheckedUpdateWithoutTransactionsInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    categoryId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RawMessageUpsertWithWhereUniqueWithoutTransactionInput = {
    where: RawMessageWhereUniqueInput
    update: XOR<RawMessageUpdateWithoutTransactionInput, RawMessageUncheckedUpdateWithoutTransactionInput>
    create: XOR<RawMessageCreateWithoutTransactionInput, RawMessageUncheckedCreateWithoutTransactionInput>
  }

  export type RawMessageUpdateWithWhereUniqueWithoutTransactionInput = {
    where: RawMessageWhereUniqueInput
    data: XOR<RawMessageUpdateWithoutTransactionInput, RawMessageUncheckedUpdateWithoutTransactionInput>
  }

  export type RawMessageUpdateManyWithWhereWithoutTransactionInput = {
    where: RawMessageScalarWhereInput
    data: XOR<RawMessageUpdateManyMutationInput, RawMessageUncheckedUpdateManyWithoutTransactionInput>
  }

  export type UserCreateWithoutRawMessagesInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryCreateNestedManyWithoutUserInput
    recipients?: RecipientCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRawMessagesInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryUncheckedCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutUserInput
    recipients?: RecipientUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    deviceTokens?: DeviceTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRawMessagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRawMessagesInput, UserUncheckedCreateWithoutRawMessagesInput>
  }

  export type TransactionCreateWithoutRawMessagesInput = {
    uuid?: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutTransactionsInput
    recipient: RecipientCreateNestedOneWithoutTransactionsInput
    category?: CategoryCreateNestedOneWithoutTransactionsInput
    subcategory?: SubcategoryCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateWithoutRawMessagesInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    categoryId?: number | null
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutRawMessagesInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutRawMessagesInput, TransactionUncheckedCreateWithoutRawMessagesInput>
  }

  export type UserUpsertWithoutRawMessagesInput = {
    update: XOR<UserUpdateWithoutRawMessagesInput, UserUncheckedUpdateWithoutRawMessagesInput>
    create: XOR<UserCreateWithoutRawMessagesInput, UserUncheckedCreateWithoutRawMessagesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRawMessagesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRawMessagesInput, UserUncheckedUpdateWithoutRawMessagesInput>
  }

  export type UserUpdateWithoutRawMessagesInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUpdateManyWithoutUserNestedInput
    recipients?: RecipientUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRawMessagesInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUncheckedUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUncheckedUpdateManyWithoutUserNestedInput
    recipients?: RecipientUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    deviceTokens?: DeviceTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type TransactionUpsertWithoutRawMessagesInput = {
    update: XOR<TransactionUpdateWithoutRawMessagesInput, TransactionUncheckedUpdateWithoutRawMessagesInput>
    create: XOR<TransactionCreateWithoutRawMessagesInput, TransactionUncheckedCreateWithoutRawMessagesInput>
    where?: TransactionWhereInput
  }

  export type TransactionUpdateToOneWithWhereWithoutRawMessagesInput = {
    where?: TransactionWhereInput
    data: XOR<TransactionUpdateWithoutRawMessagesInput, TransactionUncheckedUpdateWithoutRawMessagesInput>
  }

  export type TransactionUpdateWithoutRawMessagesInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTransactionsNestedInput
    recipient?: RecipientUpdateOneRequiredWithoutTransactionsNestedInput
    category?: CategoryUpdateOneWithoutTransactionsNestedInput
    subcategory?: SubcategoryUpdateOneWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateWithoutRawMessagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutDeviceTokensInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryCreateNestedManyWithoutUserInput
    recipients?: RecipientCreateNestedManyWithoutUserInput
    transactions?: TransactionCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutDeviceTokensInput = {
    uuid?: string
    id?: number
    email: string
    name: string
    image?: string | null
    provider: string
    subscription?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categories?: CategoryUncheckedCreateNestedManyWithoutUserInput
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutUserInput
    recipients?: RecipientUncheckedCreateNestedManyWithoutUserInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutUserInput
    rawMessages?: RawMessageUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutDeviceTokensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutDeviceTokensInput, UserUncheckedCreateWithoutDeviceTokensInput>
  }

  export type UserUpsertWithoutDeviceTokensInput = {
    update: XOR<UserUpdateWithoutDeviceTokensInput, UserUncheckedUpdateWithoutDeviceTokensInput>
    create: XOR<UserCreateWithoutDeviceTokensInput, UserUncheckedCreateWithoutDeviceTokensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutDeviceTokensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutDeviceTokensInput, UserUncheckedUpdateWithoutDeviceTokensInput>
  }

  export type UserUpdateWithoutDeviceTokensInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUpdateManyWithoutUserNestedInput
    recipients?: RecipientUpdateManyWithoutUserNestedInput
    transactions?: TransactionUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutDeviceTokensInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: StringFieldUpdateOperationsInput | string
    subscription?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categories?: CategoryUncheckedUpdateManyWithoutUserNestedInput
    subcategories?: SubcategoryUncheckedUpdateManyWithoutUserNestedInput
    recipients?: RecipientUncheckedUpdateManyWithoutUserNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutUserNestedInput
    rawMessages?: RawMessageUncheckedUpdateManyWithoutUserNestedInput
  }

  export type CategoryCreateManyUserInput = {
    id?: number
    uuid?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubcategoryCreateManyUserInput = {
    id?: number
    uuid?: string
    categoryId: number
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecipientCreateManyUserInput = {
    id?: number
    uuid?: string
    displayName: string
    normalizedName: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionCreateManyUserInput = {
    id?: number
    uuid?: string
    recipientId: number
    categoryId?: number | null
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RawMessageCreateManyUserInput = {
    id?: number
    uuid?: string
    transactionId?: number | null
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
  }

  export type DeviceTokenCreateManyUserInput = {
    id?: number
    uuid?: string
    label?: string | null
    tokenHash: string
    tokenPrefix: string
    createdAt?: Date | string
    lastUsedAt?: Date | string | null
    revokedAt?: Date | string | null
  }

  export type CategoryUpdateWithoutUserInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUpdateManyWithoutCategoryNestedInput
    transactions?: TransactionUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUncheckedUpdateManyWithoutCategoryNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryUpdateWithoutUserInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutSubcategoriesNestedInput
    transactions?: TransactionUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    categoryId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    categoryId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientUpdateWithoutUserInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    identifiers?: RecipientIdentifierUpdateManyWithoutRecipientNestedInput
    transactions?: TransactionUpdateManyWithoutRecipientNestedInput
  }

  export type RecipientUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    identifiers?: RecipientIdentifierUncheckedUpdateManyWithoutRecipientNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutRecipientNestedInput
  }

  export type RecipientUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    normalizedName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUpdateWithoutUserInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recipient?: RecipientUpdateOneRequiredWithoutTransactionsNestedInput
    category?: CategoryUpdateOneWithoutTransactionsNestedInput
    subcategory?: SubcategoryUpdateOneWithoutTransactionsNestedInput
    rawMessages?: RawMessageUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawMessages?: RawMessageUncheckedUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RawMessageUpdateWithoutUserInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transaction?: TransactionUpdateOneWithoutRawMessagesNestedInput
  }

  export type RawMessageUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    transactionId?: NullableIntFieldUpdateOperationsInput | number | null
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RawMessageUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    transactionId?: NullableIntFieldUpdateOperationsInput | number | null
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeviceTokenUpdateWithoutUserInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    label?: NullableStringFieldUpdateOperationsInput | string | null
    tokenHash?: StringFieldUpdateOperationsInput | string
    tokenPrefix?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type DeviceTokenUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    label?: NullableStringFieldUpdateOperationsInput | string | null
    tokenHash?: StringFieldUpdateOperationsInput | string
    tokenPrefix?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type DeviceTokenUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    label?: NullableStringFieldUpdateOperationsInput | string | null
    tokenHash?: StringFieldUpdateOperationsInput | string
    tokenPrefix?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    revokedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SubcategoryCreateManyCategoryInput = {
    id?: number
    uuid?: string
    userUuid: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionCreateManyCategoryInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubcategoryUpdateWithoutCategoryInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSubcategoriesNestedInput
    transactions?: TransactionUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryUncheckedUpdateWithoutCategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryUncheckedUpdateManyWithoutCategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUpdateWithoutCategoryInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTransactionsNestedInput
    recipient?: RecipientUpdateOneRequiredWithoutTransactionsNestedInput
    subcategory?: SubcategoryUpdateOneWithoutTransactionsNestedInput
    rawMessages?: RawMessageUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateWithoutCategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawMessages?: RawMessageUncheckedUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateManyWithoutCategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManySubcategoryInput = {
    id?: number
    uuid?: string
    userUuid: string
    recipientId: number
    categoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionUpdateWithoutSubcategoryInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTransactionsNestedInput
    recipient?: RecipientUpdateOneRequiredWithoutTransactionsNestedInput
    category?: CategoryUpdateOneWithoutTransactionsNestedInput
    rawMessages?: RawMessageUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateWithoutSubcategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawMessages?: RawMessageUncheckedUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateManyWithoutSubcategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    recipientId?: IntFieldUpdateOperationsInput | number
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientIdentifierCreateManyRecipientInput = {
    id?: number
    uuid?: string
    userUuid: string
    kind: $Enums.RecipientIdentifierKind
    value: string
    normalizedValue: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionCreateManyRecipientInput = {
    id?: number
    uuid?: string
    userUuid: string
    categoryId?: number | null
    subcategoryId?: number | null
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    type?: $Enums.TransactionType
    source: $Enums.TransactionSource
    recipientRaw: string
    recipientName?: string | null
    reference?: string | null
    accountLabel?: string | null
    remarks?: string | null
    locationRaw?: string | null
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecipientIdentifierUpdateWithoutRecipientInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    kind?: EnumRecipientIdentifierKindFieldUpdateOperationsInput | $Enums.RecipientIdentifierKind
    value?: StringFieldUpdateOperationsInput | string
    normalizedValue?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientIdentifierUncheckedUpdateWithoutRecipientInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    kind?: EnumRecipientIdentifierKindFieldUpdateOperationsInput | $Enums.RecipientIdentifierKind
    value?: StringFieldUpdateOperationsInput | string
    normalizedValue?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecipientIdentifierUncheckedUpdateManyWithoutRecipientInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    kind?: EnumRecipientIdentifierKindFieldUpdateOperationsInput | $Enums.RecipientIdentifierKind
    value?: StringFieldUpdateOperationsInput | string
    normalizedValue?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUpdateWithoutRecipientInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutTransactionsNestedInput
    category?: CategoryUpdateOneWithoutTransactionsNestedInput
    subcategory?: SubcategoryUpdateOneWithoutTransactionsNestedInput
    rawMessages?: RawMessageUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateWithoutRecipientInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawMessages?: RawMessageUncheckedUpdateManyWithoutTransactionNestedInput
  }

  export type TransactionUncheckedUpdateManyWithoutRecipientInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    categoryId?: NullableIntFieldUpdateOperationsInput | number | null
    subcategoryId?: NullableIntFieldUpdateOperationsInput | number | null
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    source?: EnumTransactionSourceFieldUpdateOperationsInput | $Enums.TransactionSource
    recipientRaw?: StringFieldUpdateOperationsInput | string
    recipientName?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    accountLabel?: NullableStringFieldUpdateOperationsInput | string | null
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RawMessageCreateManyTransactionInput = {
    id?: number
    uuid?: string
    userUuid: string
    body: string
    source?: $Enums.RawMessageSource
    parseStatus: $Enums.ParseStatus
    parserName?: string | null
    failureReason?: string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: string | null
    receivedAt?: Date | string
    createdAt?: Date | string
  }

  export type RawMessageUpdateWithoutTransactionInput = {
    uuid?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRawMessagesNestedInput
  }

  export type RawMessageUncheckedUpdateWithoutTransactionInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RawMessageUncheckedUpdateManyWithoutTransactionInput = {
    id?: IntFieldUpdateOperationsInput | number
    uuid?: StringFieldUpdateOperationsInput | string
    userUuid?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    source?: EnumRawMessageSourceFieldUpdateOperationsInput | $Enums.RawMessageSource
    parseStatus?: EnumParseStatusFieldUpdateOperationsInput | $Enums.ParseStatus
    parserName?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    parsedPayload?: NullableJsonNullValueInput | InputJsonValue
    locationRaw?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}