export interface WorkflowStartResult {
  id: string;
  definitionId: string;
  businessKey: string;
  caseInstanceId: string;
  ended: true;
  suspended: boolean;
  tenantId: string;
}

/**
 * Variable value to be assigned to a message payload.
 */
export interface ProcessVariableValue {
  value: string;
  type: "string" | "integer";
}

/**
 * Variable to be send with a message payload.
 */
export interface ProcessVariable {
  [k: string]: ProcessVariableValue;
}

export interface SendMessagePayload {
  /**
   * The name of the message to deliver.
   */
  messageName: string;
  /**
   * A Boolean value that indicates whether the message should
   * be correlated to exactly one entity or multiple entities.
   * If the value is set to false, the message will be correlated
   * to exactly one entity (execution or process definition).
   * If the value is set to true, the message will be correlated
   * to multiple executions and a process definition that can be
   * instantiated by this message in one go.
   */
  all: boolean;
  /**
   * Used to correlate the message to the process
   * instance with the given id.
   */
  processInstanceId?: string;
  /**
   * Optional variables to be send alongside the message payload.
   */
  processVariables?: ProcessVariable;
}
