import PTxId from "../../API/V1/Tx/PTxId";
import PTxOutRef from "../../API/V1/Tx/PTxOutRef";
import pisUtxoSpent from "../../API/V2/lib/ctx/pisUtxoSpent";
import PScriptContext from "../../API/V2/ScriptContext/PScriptContext";
import { pByteString, pInt, pmakeUnit } from "../../PTypes";
import { pif, pisEmpty } from "../../stdlib";
import { pfn, plet, perror } from "../../Syntax";
import { data, unit } from "../../Term/Type";
import compile, { PlutusScriptVersion, scriptToJsonFormat } from "../compile";

describe("onwShotPolicy", () => {

    const oneShotPolicy = pfn([
        PTxOutRef.type,
        data,
        PScriptContext.type
    ],  unit)
    (( mustSpendUtxo, _rdmr, _ctx ) => 
        _ctx.extract("txInfo").in( ctx =>
        ctx.txInfo.extract("inputs","mint").in( tx =>
    
            pif( unit ).$(
    
                pisUtxoSpent.$( mustSpendUtxo ).$( tx.inputs )
                .and(
                    // single policy
                    pisEmpty.$( tx.mint.tail )
                )
                .and(
                    plet( tx.mint.head.snd ).in( assetsOfPolicy => {

                        // single asset name
                        return pisEmpty.$( assetsOfPolicy.tail )
                        .and(
                            // single token minted
                            assetsOfPolicy.head.snd.eq( 1 )
                        );}
                    )
                )
            
            )
            .then( pmakeUnit() )
            .else( perror( unit ) )
    
        ))
    );

    test("compiles", () => {

        let compiled;

        expect(
            () => {
                compiled = compile(
                    oneShotPolicy.$(
                        PTxOutRef.PTxOutRef({
                            id: PTxId.PTxId({ txId: pByteString("deadbeef") }),
                            index: pInt( 1 )
                        })
                    )
                );
            }
        ).not.toThrow();

        //*
        console.log(
            scriptToJsonFormat( compiled as any, PlutusScriptVersion.V2, "oneShotPolicy @ deadbeef#1" )    
        );
        //*/
    })

})