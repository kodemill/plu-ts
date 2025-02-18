import type PType from "../../PType";
import type PDataRepresentable from "../../PType/PDataRepresentable";
import type { PAlias } from "../../PTypes";
import type { AliasDefinition } from "../../PTypes/PAlias/palias";
import type PBool from "../../PTypes/PBool";
import type PByteString from "../../PTypes/PByteString";
import type PData from "../../PTypes/PData/PData";
import type PDataBS from "../../PTypes/PData/PDataBS";
import type PDataConstr from "../../PTypes/PData/PDataConstr";
import type PDataInt from "../../PTypes/PData/PDataInt";
import type PDataList from "../../PTypes/PData/PDataList";
import type PDataMap from "../../PTypes/PData/PDataMap";
import type PDataPair from "../../PTypes/PData/PDataPair";
import type PDelayed from "../../PTypes/PDelayed";
import type PLam from "../../PTypes/PFn/PLam";
import type PInt from "../../PTypes/PInt";
import type PList from "../../PTypes/PList";
import type PPair from "../../PTypes/PPair";
import type PString from "../../PTypes/PString";
import type PUnit from "../../PTypes/PUnit";

import JsRuntime from "../../../../utils/JsRuntime";

export const enum PrimType {
    Int  = "Int",
    BS   = "ByteString",
    Str  = "Str",
    Unit = "Unit",
    Bool = "Bool",
    List = "List",
    Pair = "Pair",
    Delayed = "Delayed",
    Lambda = "Lambda"
}

export const enum DataConstructor {
    Any = "GenericData",
    Constr = "DataConstructor",
    Pair = "DataPair",
    List = "DataList",
    Int = "DataInt",
    BS = "DataByteString",
}

export type TermTypeParameter = symbol;

export const structType = Symbol("structType");
export const anyStruct  = Symbol("anyStruct");



export type ConstantableStructCtorDef = {
    [field: string | number]: ConstantableTermType | ConstantableStructType
}

export type GenericStructCtorDef = {
    [field: string | number]: ConstantableTermType | StructType | [ symbol ]
}

export type StructCtorDef = ConstantableStructCtorDef | GenericStructCtorDef;


export type ConstantableStructDefinition = {
    [constructor: string]: ConstantableStructCtorDef
}

export type GenericStructDefinition = {
    [constructor: string]: GenericStructCtorDef
}

export type StructDefinition = GenericStructDefinition;


/**
 * type of a struct with all types defined
 */
export type ConstantableStructType  = readonly [ typeof structType, ConstantableStructDefinition ];
export type GenericStructType       = readonly [ typeof structType, StructDefinition | typeof anyStruct ];
export type StructType              = readonly [ typeof structType, StructDefinition | typeof anyStruct ];

export const aliasType = Symbol("aliasType");

export type AliasTermType<AliasId extends symbol, T extends ConstantableTermType> = readonly [ typeof aliasType, AliasDefinition<T,AliasId> ];
export type AnyAlias = AliasTermType<symbol, ConstantableTermType>;

export type TypeName = PrimType | DataConstructor | TermTypeParameter

export type DataType = [ DataConstructor, ...DataType[] ]

export type LambdaType<InT extends TermType, OutT extends TermType> = readonly [ PrimType.Lambda, InT, OutT ];
export type FnType<Ins extends [ TermType, ...TermType[] ], OutT extends TermType> =
    Ins extends [] ? OutT :
    Ins extends [ infer In extends TermType ] ? LambdaType<In, OutT> :
    Ins extends [ infer In extends TermType, ...infer RestIns extends [ TermType, ...TermType[] ] ] ? LambdaType<In, FnType< RestIns, OutT >> :
    TermType;

// needed to avoid circuar dependecies
function cloneStructCtorDef<CtorDef extends StructCtorDef>( ctorDef: Readonly<CtorDef> ): CtorDef
{
    const clone: CtorDef = {} as any;

    for( const fieldName in ctorDef )
    {
        clone[ fieldName ] = ctorDef[ fieldName ];
    }

    return clone;
}

// needed to avoid circuar dependecies
function cloneStructDef<SDef extends StructDefinition>( def: Readonly<SDef> ): SDef
{
    const clone: SDef = {} as SDef;

    for( const ctorName in def )
    {
        clone[ ctorName ] = cloneStructCtorDef( def[ ctorName ] ) as any;
    }

    return clone;
}


//@ts-ignore
const Type: {
    readonly Var:   ( description?: any ) => [ TermTypeParameter ]
    readonly Any:   [ TermTypeParameter ];
    readonly Int:   [ PrimType.Int ];
    readonly BS:    [ PrimType.BS ];
    readonly Str:   [ PrimType.Str ];
    readonly Unit:  [ PrimType.Unit ];
    readonly Bool:  [ PrimType.Bool ];
    readonly List:  <T extends TermType>(ofElem: T) => [ PrimType.List, T ];
    readonly Pair:  <FstT extends TermType, SndT extends TermType>(fst: FstT, snd: SndT) => [ PrimType.Pair, FstT, SndT ] ;
    readonly Map:   <KeyT extends TermType, ValT extends TermType>(k: KeyT, v: ValT) => [PrimType.List, [PrimType.Pair, KeyT, ValT]]
    readonly Delayed: <T extends TermType>(toDelay: T) => [ PrimType.Delayed, T ];
    readonly Lambda: <InT extends TermType, OutT extends TermType>(input: InT, output: OutT) => [ PrimType.Lambda, InT, OutT ];
    readonly Fn: <InsTs extends [ TermType, ...TermType[] ], OutT extends TermType>( inputs: InsTs, output: OutT ) => FnType<InsTs, OutT>
    readonly Struct: ( def: StructDefinition | typeof anyStruct ) => StructType
    readonly Data: {
        readonly Any: [ DataConstructor.Any ];
        readonly Constr: [ DataConstructor.Constr ];
        readonly Map: (keyType: DataType, valueType: DataType) => DataType;
        readonly Pair: (fstType: DataType, sndType: DataType) => DataType;
        readonly List: (elements: DataType) => DataType;
        readonly Int: FixedTermDataType;
        readonly BS: FixedTermDataType;
    }
 } = Object.freeze(
    Object.defineProperty({
    Var:        ( description?: any ) => Object.freeze([ Symbol( description ) ]),
    // Any:        Object.freeze([ PrimType.Any ]),
    Int:        Object.freeze([ PrimType.Int ]),
    BS:         Object.freeze([ PrimType.BS ]),
    Str:        Object.freeze([ PrimType.Str ]),
    Unit:       Object.freeze([ PrimType.Unit ]),
    Bool:       Object.freeze([ PrimType.Bool ]),
    List:       <T extends TermType>( ofElem: T ): readonly [ PrimType.List, T ] => Object.freeze([ PrimType.List, ofElem ]) ,
    Pair:       <FstT extends TermType, SndT extends TermType>( fst: FstT, snd: SndT ): readonly [ PrimType.Pair, FstT, SndT ] => Object.freeze([ PrimType.Pair, fst, snd ]),
    Map:        <KeyT extends TermType, ValT extends TermType>( k: KeyT, v: ValT ) => Type.List( Type.Pair( k, v ) ),
    Delayed:    <T extends TermType>( toDelay: T ): readonly [ PrimType.Delayed, T ] => Object.freeze([ PrimType.Delayed, toDelay ]),
    Lambda:     <InT extends TermType, OutT extends TermType>( input: InT, output: OutT ): LambdaType< InT, OutT > => Object.freeze([ PrimType.Lambda, input, output ]),
    Fn:         <InsTs extends [ TermType, ...TermType[] ], OutT extends TermType>( inputs: InsTs , output: TermType ): FnType<InsTs, OutT> => {
        JsRuntime.assert(
            inputs.length > 0,
            "unsupported '(void) => any' type at Pluts level"
        );

        if( inputs.length === 1 ) return Object.freeze( Type.Lambda( inputs[0], output ) ) as any;

        return Object.freeze( Type.Lambda( inputs[ 0 ], Type.Fn( inputs.slice( 1 ) as [ TermType, ...TermType[] ], output ) ) ) as any;
    },
    Struct:     ( def: StructDefinition | typeof anyStruct ): StructType =>
        Object.freeze([ 
            structType,
            typeof def === "symbol" ?
                def :
                Object.freeze( cloneStructDef( def ) )
        ]),
    Data: Object.freeze({
        Any:    Object.freeze([ DataConstructor.Any ]),
        Constr: Object.freeze([ DataConstructor.Constr as FixedDataTypeName ]),
        Map:    ( keyType: DataType, valueType: DataType ) => Object.freeze( Type.Data.List( Type.Data.Pair( keyType, valueType) ) ),
        Pair:   ( fstType: DataType, sndType: DataType ) => Object.freeze([ DataConstructor.Pair, fstType, sndType ]),
        List:   ( elements: DataType ) => Object.freeze([ DataConstructor.List, elements ]),
        Int:    Object.freeze([ DataConstructor.Int as FixedDataTypeName ]),
        BS:     Object.freeze([ DataConstructor.BS as FixedDataTypeName ])
    })
}, "Any", {configurable: false, enumerable: true, get: () => Type.Var("Type.Any"), set: ( _v?: any ) => {} }));

export default Type;

/**
 * Utility object to get fixed type
 * 
 * > example usage:
 * >
 * >  ```ts
 * >  const { fn, lam, int } = TypeShortcut;
 * >  
 * >  // both equivalent to:    Type.Lambda( Type.Int, Type.Lambda( Type.Int, Type.Int ) );
 * >  const intBinOpType =      lam( int, lam( int, int ) );
 * >  const same =              fn([ int, int ], int);
 * >  ```
 */
export const TypeShortcut = Object.freeze({
    int: Type.Int,
    bs: Type.BS,
    str: Type.Str,
    unit: Type.Unit,
    bool: Type.Bool,
    list: Type.List,
    pair: Type.Pair,
    map: Type.Map,
    struct: Type.Struct,
    delayed: Type.Delayed,
    lam: Type.Lambda,
    fn: Type.Fn,
    data: Type.Data.Any
})

export const int        = Type.Int;
export const bs         = Type.BS;
export const str        = Type.Str;
export const unit       = Type.Unit;
export const bool       = Type.Bool;
export const list       = Type.List;
export const pair       = Type.Pair;
export const map        = Type.Map;
export const lam        = Type.Lambda;
export const fn         = Type.Fn;
export const delayed    = Type.Delayed;
export const tyVar      = Type.Var;
export const struct     = Type.Struct;
export const data       = Type.Data.Any;


// Type = TypeName followed by optional (nested) Types
export type TermType = readonly [ TypeName, ...TermType[] ] | StructType | AnyAlias ;

export type FixedDataTypeName
    = DataConstructor.Constr
    | DataConstructor.List
    | DataConstructor.Pair
    | DataConstructor.Int
    | DataConstructor.BS;

export type FixedTermDataType = [ FixedDataTypeName, ...FixedTermDataType[] ]

export type FixedTypeName
    = PrimType.Int
    | PrimType.BS
    | PrimType.Bool
    | PrimType.Delayed
    | PrimType.Lambda
    | PrimType.List
    | PrimType.Pair
    | PrimType.Str
    | PrimType.Unit;

/**
 * ```TermType``` without ```Any``` or parameters
*/
export type FixedTermType = [ FixedTypeName, ...FixedTermType[] ] | FixedTermDataType

export type ConstantableTypeName
    = PrimType.Int
    | PrimType.BS
    | PrimType.Bool
    | PrimType.List
    | PrimType.Pair
    | PrimType.Str
    | PrimType.Unit
    | DataConstructor;

export type ConstantableTermType
    = [ ConstantableTypeName, ...ConstantableTermType[] ]
    | ConstantableStructType
    | readonly [typeof aliasType, {
        id: symbol;
        type: ConstantableTermType;
    }];
