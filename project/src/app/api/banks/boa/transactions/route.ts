import { NextResponse } from 'next/server';
import boaData from '../../../../../../data/transactions/boa.json';

export async function GET() {
  return NextResponse.json(boaData);
}
