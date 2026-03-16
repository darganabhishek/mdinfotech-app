declare module 'paytmchecksum' {
  class PaytmChecksum {
    static generateSignature(params: string | any, mkey: string): Promise<string>;
    static verifySignature(params: string | any, mkey: string, checksum: string): boolean;
  }
  export default PaytmChecksum;
}
