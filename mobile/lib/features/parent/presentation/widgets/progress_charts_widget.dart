import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class ProgressChartsWidget extends StatelessWidget {
  final List<Map<String, dynamic>> attendanceData;
  final List<Map<String, dynamic>> gradesData;
  final double? averageScore;

  const ProgressChartsWidget({
    super.key,
    required this.attendanceData,
    required this.gradesData,
    this.averageScore,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Graphique de présence
        if (attendanceData.isNotEmpty) ...[
          const Text(
            'Présences par semaine',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildAttendanceChart(context),
          const SizedBox(height: 24),
        ],
        // Graphique des notes
        if (gradesData.isNotEmpty) ...[
          const Text(
            'Évolution des notes',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildGradesChart(context),
          const SizedBox(height: 24),
        ],
        // Moyenne générale
        if (averageScore != null) ...[
          Card(
            color: Theme.of(context).primaryColor.withOpacity(0.1),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      Text(
                        'Moyenne générale',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        averageScore!.toStringAsFixed(2),
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              color: Theme.of(context).primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  _buildScoreIndicator(averageScore!),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildAttendanceChart(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Légende
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildLegendItem('Présents', Colors.green),
                _buildLegendItem('Absents', Colors.red),
                _buildLegendItem('En retard', Colors.orange),
                _buildLegendItem('Excusés', Colors.blue),
              ],
            ),
            const SizedBox(height: 16),
            // Barres
            SizedBox(
              height: 200,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: attendanceData.map((week) {
                  final present = week['present'] ?? 0;
                  final absent = week['absent'] ?? 0;
                  final late = week['late'] ?? 0;
                  final excused = week['excused'] ?? 0;
                  final total = week['total'] ?? 1;
                  
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          // Barres empilées
                          Expanded(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.green,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                    ),
                                    height: (present / total) * 100,
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.red,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                    ),
                                    height: (absent / total) * 100,
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.orange,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                    ),
                                    height: (late / total) * 100,
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.blue,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                    ),
                                    height: (excused / total) * 100,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 4),
                          // Label semaine
                          Text(
                            week['label'] ?? '',
                            style: const TextStyle(fontSize: 10),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGradesChart(BuildContext context) {
    if (gradesData.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('Aucune note disponible'),
        ),
      );
    }

    // Grouper par matière
    final Map<String, List<double>> gradesBySubject = {};
    for (var grade in gradesData) {
      final subject = grade['subject']?['name'] ?? 'Autre';
      final score = grade['score'] ?? 0.0;
      final totalPoints = grade['total_points'] ?? 1.0;
      final percentage = (score / totalPoints) * 20; // Convertir sur 20
      
      if (!gradesBySubject.containsKey(subject)) {
        gradesBySubject[subject] = [];
      }
      gradesBySubject[subject]!.add(percentage);
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: gradesBySubject.entries.map((entry) {
            final subject = entry.key;
            final grades = entry.value;
            final average = grades.reduce((a, b) => a + b) / grades.length;
            
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: Text(
                      subject,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: LinearProgressIndicator(
                      value: average / 20,
                      backgroundColor: Colors.grey[300],
                      valueColor: AlwaysStoppedAnimation<Color>(
                        average >= 10 ? Colors.green : Colors.red,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    average.toStringAsFixed(1),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: average >= 10 ? Colors.green : Colors.red,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildScoreIndicator(double score) {
    final percentage = (score / 20) * 100;
    Color color;
    if (percentage >= 75) {
      color = Colors.green;
    } else if (percentage >= 50) {
      color = Colors.orange;
    } else {
      color = Colors.red;
    }

    return SizedBox(
      width: 80,
      height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 80,
            height: 80,
            child: CircularProgressIndicator(
              value: percentage / 100,
              strokeWidth: 8,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          Text(
            '${percentage.toStringAsFixed(0)}%',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
