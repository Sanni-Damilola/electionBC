import express, { Application, Request, Response } from "express";
import mongoose, { Document, Model, Schema } from "mongoose";

const PORT: number = 2023;
const url: string = "mongodb://127.0.0.1:27017/resultDB";

mongoose
  .connect(url)
  .then(() => {
    console.log(`Database connection was established.`);
  })
  .catch((error) => {
    console.log(`Error connecting to ${url}`);
  });

interface IElection extends Document {
  state: string;
  parties: string;
  result: number;
  collationOfficer: string;
  isRigged: boolean;
  totalLg: number;
}

const electionSchema: Schema = new mongoose.Schema({
  state: {
    type: String,
  },
  parties: {
    type: String,
  },
  result: {
    type: Number,
  },
  collationOfficer: {
    type: String,
  },
  isRigged: {
    type: Boolean,
    default: false,
  },
  totalLg: {
    type: Number,
  },
});

const electionModel: Model<IElection> = mongoose.model<IElection>(
  "electionresult",
  electionSchema
);

const app: Application = express();
app.use(express.json());

app.get("/gettotal", async (req: Request, res: Response) => {
  const { parties } = req.body;
  try {
    const checkRig = await electionModel.findOne({ parties });
    const getName = (await electionModel.find({ parties })).map(
      (el) => el.parties
    )[0];
    const allResults = (await electionModel.find({ parties })).reduce(
      (acc, el) => acc + el.result,
      0
    );

    res.status(200).json({
      message: `The Total Result for ${getName}`,
      Rigged: checkRig?.isRigged || false,
      result: allResults,
    });
  } catch (error) {
    res.status(500).json({ Error: "Internal Server Error" });
  }
});

app.post("/post-election", async (req: Request, res: Response) => {
  const data = req.body;
  try {
    const result = await electionModel.create(data);
    res.status(201).json({
      message: "Created successfully.",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      Error: "Unable to create election result.",
    });
  }
});

app.get("/results", async (req: Request, res: Response) => {
  try {
    const results = await electionModel.find();
    res.status(200).json({
      message: "Results",
      data: results,
    });
  } catch (error) {
    res.status(500).json({ Error: "Internal Server Error" });
  }
});

app.get("/results/:stateId", async (req: Request, res: Response) => {
  const stateId = req.params.stateId;
  try {
    const result = await electionModel.findById(stateId);
    if (!result) {
      res.status(404).json({
        Error: "No result found for this state.",
      });
    } else {
      res.status(200).json({
        message: "Results",
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({ Error: "Internal Server Error" });
  }
});

app.put("/rigged/:stateId", async (req: Request, res: Response) => {
  const stateId = req.params.stateId;
  const { result } = req.body;
  try {
    const updatedResult = await electionModel.findByIdAndUpdate(
      stateId,
      { result, isRigged: true },
      { new: true }
    );
    if (!updatedResult) {
      res.status(400).json({
        Error: `Unable to update election result for state with ID ${stateId}`,
      });
    } else {
      res.status(200).json({
        message: "Successfully updated.",
        data: updatedResult,
      });
    }
  } catch (error) {
    res.status(500).json({ Error: "Internal Server Error" });
  }
});

app.delete("/results/:stateId", async (req: Request, res: Response) => {
  const stateId = req.params.stateId;
  try {
    const deletedResult = await electionModel.findByIdAndDelete(stateId);
    if (!deletedResult) {
      res.status(400).json({
        Error: `Unable to delete election result for state with ID ${stateId}`,
      });
    } else {
      res.status(200).json({
        message: "Successfully deleted.",
        data: deletedResult,
      });
    }
  } catch (error) {
    res.status(500).json({ Error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening to port ${PORT}`);
});
