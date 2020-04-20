const qs = require( "qs" );
const https = require( "https" );

const createVkApi = ( token ) => {
    const cache = {};
    return ( method, pars ) => {
        pars.v = pars.v || "5.103";
        if ( cache[ JSON.stringify( pars ) ] ) {
            return Promise.resolve( cache[ JSON.stringify( pars ) ] );
        } else {
            return new Promise( ( resolve, reject ) => {
                const params = qs.stringify( pars );
                https.get( {
                    host: "api.vk.com",
                    path: `/method/${method}?${params}&access_token=${token}`
                }, res => {
                    let resData = "";
                    res.on( "data", data => resData += data.toString() );
                    res.on( "end", () => {
                        try {
                            const result = JSON.parse( resData );
                            if ( result.error ) {
                                reject( result.error )
                            } else {
                                cache[ JSON.stringify( pars ) ] = result.response;
                                resolve( result.response )
                            }
                        } catch ( e ) {
                            reject( e.message )
                        }
                    } )
                } )
            } )
        }
    }
};

module.exports = {
    createVkApi
}