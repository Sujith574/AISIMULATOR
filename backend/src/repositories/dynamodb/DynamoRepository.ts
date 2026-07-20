import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocClient, getDynamoTableName } from "../../config/aws";
import { IRepository, User, UserProfile, LifeAssessment, Habit, SimulationReport, WhatIfScenario } from "../interfaces/Repository";

export class DynamoRepository implements IRepository {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    if (!dynamoDbDocClient) {
      throw new Error("DynamoDB client is not initialized. Ensure PROVIDER_MODE is set to 'aws'.");
    }
    this.client = dynamoDbDocClient;
    this.tableName = getDynamoTableName();
  }

  // Users
  async createUser(user: User): Promise<User> {
    const item = {
      PK: `USER#${user.id}`,
      SK: "METADATA",
      ...user
    };
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));
    // Save email -> user mapping for fast lookup by email
    await this.saveUserEmailMapping(user.email, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // Single Table Design GSI check or Scan. For users, standard GSI1 exists, or we scan in this table.
    // Let's implement a query on GSI1 or scan for email if GSI is not provisioned. To make it robust:
    // We assume GSI1 is indexed on "email" or we query it.
    // Let's query using Scan or Query with Filter. For a prototype, Query is preferred, but since Partition Key is ID,
    // let's scan for the email. In production, we'd query a GSI email-index or create a separate item with PK: USEREMAIL#email.
    // Let's write the USEREMAIL partition key pattern for user email uniqueness lookups! 
    // This is the optimal DynamoDB Single Table pattern for quick user-by-email lookups without GSIs.
    const pk = `USEREMAIL#${email.toLowerCase()}`;
    const response = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: "METADATA" }
    }));
    if (!response.Item) return null;
    return response.Item.user as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const response = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: `USER#${id}`, SK: "METADATA" }
    }));
    if (!response.Item) return null;
    return {
      id: response.Item.id,
      email: response.Item.email,
      createdAt: response.Item.createdAt
    };
  }

  // Profiles
  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${profile.userId}`,
        SK: "PROFILE",
        ...profile
      }
    }));
    return profile;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const response = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" }
    }));
    if (!response.Item) return null;
    const { PK, SK, ...profile } = response.Item;
    return profile as UserProfile;
  }

  // Assessments
  async saveAssessment(assessment: LifeAssessment): Promise<LifeAssessment> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${assessment.userId}`,
        SK: "ASSESSMENT",
        ...assessment
      }
    }));
    return assessment;
  }

  async getAssessment(userId: string): Promise<LifeAssessment | null> {
    const response = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: `USER#${userId}`, SK: "ASSESSMENT" }
    }));
    if (!response.Item) return null;
    const { PK, SK, ...assessment } = response.Item;
    return assessment as LifeAssessment;
  }

  // Habits
  async saveHabit(habit: Habit): Promise<Habit> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${habit.userId}`,
        SK: `HABIT#${habit.id}`,
        ...habit
      }
    }));
    return habit;
  }

  async getHabits(userId: string): Promise<Habit[]> {
    const response = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":skPrefix": "HABIT#"
      }
    }));
    if (!response.Items) return [];
    return response.Items.map(item => {
      const { PK, SK, ...habit } = item;
      return habit as Habit;
    });
  }

  async deleteHabit(userId: string, habitId: string): Promise<boolean> {
    try {
      await this.client.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `HABIT#${habitId}`
        }
      }));
      return true;
    } catch {
      return false;
    }
  }

  // Simulations
  async saveSimulation(simulation: SimulationReport): Promise<SimulationReport> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${simulation.userId}`,
        SK: `SIMULATION#${simulation.id}`,
        ...simulation
      }
    }));
    return simulation;
  }

  async getLatestSimulation(userId: string): Promise<SimulationReport | null> {
    const simulations = await this.getSimulationHistory(userId);
    return simulations.length > 0 ? simulations[0] : null;
  }

  async getSimulationHistory(userId: string): Promise<SimulationReport[]> {
    const response = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":skPrefix": "SIMULATION#"
      }
    }));
    if (!response.Items) return [];
    const simulations = response.Items.map(item => {
      const { PK, SK, ...simulation } = item;
      return simulation as SimulationReport;
    });
    // Sort in code by creation date descending
    return simulations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // What-If Scenarios
  async saveWhatIf(whatif: WhatIfScenario): Promise<WhatIfScenario> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${whatif.userId}`,
        SK: `WHATIF#${whatif.id}`,
        ...whatif
      }
    }));
    return whatif;
  }

  async getWhatIfHistory(userId: string): Promise<WhatIfScenario[]> {
    const response = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":skPrefix": "WHATIF#"
      }
    }));
    if (!response.Items) return [];
    const whatifs = response.Items.map(item => {
      const { PK, SK, ...whatif } = item;
      return whatif as WhatIfScenario;
    });
    return whatifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Helper method for email user mapping helper
  async saveUserEmailMapping(email: string, user: User) {
    const pk = `USEREMAIL#${email.toLowerCase()}`;
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: pk,
        SK: "METADATA",
        user
      }
    }));
  }
}
