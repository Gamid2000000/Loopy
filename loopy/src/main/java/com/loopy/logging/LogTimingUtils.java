package com.loopy.logging;

public class LogTimingUtils {
	public static long calculateDurationDifference(long durationStart) {
		return System.currentTimeMillis() - durationStart;
	}
}
