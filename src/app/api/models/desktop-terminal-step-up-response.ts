/* tslint:disable */
/* eslint-disable */

/**
 * The minted desktop step-up token + its TTL (for the SSH-terminal handshake and the remote-install header).
 */
export interface DesktopTerminalStepUpResponse {

  /**
   * Opaque single-use step-up token; present on the X-Device-Terminal-StepUp header (CLI) or the snapdragon.device-terminal.stepup.<token> subprotocol (browser).
   */
  stepUpToken?: string;

  /**
   * Token time-to-live in minutes.
   */
  ttlMinutes?: number;
}
