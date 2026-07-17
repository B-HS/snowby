import { describe, expect, test } from 'bun:test'
import { calculateDistanceMeters } from './geo'

describe('calculateDistanceMeters', () => {
    test('같은 좌표는 0 을 반환한다', () => {
        expect(calculateDistanceMeters(37.5, 127.0, 37.5, 127.0)).toBe(0)
    })

    test('위도 1도 차이는 약 111km 다', () => {
        const distance = calculateDistanceMeters(37.0, 127.0, 38.0, 127.0)
        expect(distance).toBeGreaterThan(110000)
        expect(distance).toBeLessThan(112000)
    })

    test('대칭이다 (A→B == B→A)', () => {
        const ab = calculateDistanceMeters(37.5665, 126.978, 35.1796, 129.0756)
        const ba = calculateDistanceMeters(35.1796, 129.0756, 37.5665, 126.978)
        expect(Math.abs(ab - ba)).toBeLessThan(0.001)
    })

    test('서울-부산은 약 325km 다', () => {
        const distance = calculateDistanceMeters(37.5665, 126.978, 35.1796, 129.0756)
        expect(distance).toBeGreaterThan(320000)
        expect(distance).toBeLessThan(330000)
    })
})
