import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ActivitiesTable } from "./activities-table";

describe("ActivitiesTable", () => {
  it("renders the title, search, filter, and activity rows", () => {
    render(<ActivitiesTable />);

    expect(screen.getByText("Recent Activities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
    expect(screen.getByText("GCash Cash In")).toBeInTheDocument();
    expect(screen.getByText("ORD-7241")).toBeInTheDocument();
    expect(screen.getByText("₱42,000.00")).toBeInTheDocument();
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("filters rows by activity name", async () => {
    const user = userEvent.setup();
    render(<ActivitiesTable />);

    await user.type(screen.getByLabelText("Search activities"), "salary");

    expect(screen.getByText("Salary Credit")).toBeInTheDocument();
    expect(screen.queryByText("GCash Cash In")).not.toBeInTheDocument();
  });
});
